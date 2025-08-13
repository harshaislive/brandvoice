import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// Get system settings from beforest_settings table
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    
    // Load only prompts from beforest_settings table
    const { data: settings, error } = await supabase
      .from('beforest_settings')
      .select('setting_key, setting_value, updated_at')
      .eq('setting_key', 'prompts')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings' }, 
        { status: 500 }
      )
    }

    // Convert to key-value object for easier frontend use
    const settingsObject: Record<string, string> = {}
    let lastUpdated: string | null = null

    if (settings && settings.length > 0) {
      const promptsSetting = settings[0] // Since we're only querying for 'prompts'
      
      // Handle the nested prompts structure
      try {
        let promptsData = promptsSetting.setting_value
        
        // If it's a string, parse it as JSON
        if (typeof promptsData === 'string') {
          promptsData = JSON.parse(promptsData)
        }
        
        // Extract individual prompts
        if (promptsData && typeof promptsData === 'object') {
          settingsObject['prompts.main'] = promptsData.main || ''
          settingsObject['prompts.transform'] = promptsData.transform || ''
          settingsObject['prompts.justification'] = promptsData.justification || ''
        }
        
        // Get the update timestamp
        lastUpdated = promptsSetting.updated_at
      } catch (error) {
        console.error('Error parsing prompts JSON:', error)
      }
    }

    return NextResponse.json({ 
      settings: settingsObject,
      lastUpdated,
      count: Object.keys(settingsObject).length
    })
  } catch (error) {
    console.error('Get settings error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch settings' }, 
      { status: 500 }
    )
  }
}

// Update system settings using update_setting RPC function
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { settings } = await request.json()
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' }, 
        { status: 400 }
      )
    }

    // Validate required prompt settings
    const requiredKeys = ['prompts.main', 'prompts.transform', 'prompts.justification']
    for (const key of requiredKeys) {
      if (!settings[key] || typeof settings[key] !== 'string' || settings[key].trim().length < 10) {
        return NextResponse.json({ 
          error: `${key} must be a string with at least 10 characters` 
        }, { status: 400 })
      }
    }

    // Combine all prompts into a single nested object to match your data structure
    const promptsData = {
      main: settings['prompts.main'] || '',
      transform: settings['prompts.transform'] || '',
      justification: settings['prompts.justification'] || ''
    }

    try {
      // Save as a single "prompts" setting with nested structure
      const { error } = await supabase
        .from('beforest_settings')
        .upsert({
          setting_key: 'prompts',
          setting_value: JSON.stringify(promptsData), // Store as JSON string in jsonb
          updated_by: user.email || 'admin',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        })

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        message: 'Settings saved successfully',
        saved: 1,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Save settings error:', error)
      return NextResponse.json({ 
        error: 'Failed to save settings to database',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Update settings error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update settings' }, 
      { status: 500 }
    )
  }
}

// Update individual setting using RPC function
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { key, value } = await request.json()
    
    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' }, 
        { status: 400 }
      )
    }

    // Update single setting using direct table update
    const { error } = await supabase
      .from('beforest_settings')
      .upsert({
        setting_key: key,
        setting_value: value, // Store directly as jsonb will handle it
        updated_by: user.email || 'admin',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })

    if (error) {
      console.error('Error updating setting:', error)
      return NextResponse.json(
        { error: 'Failed to update setting' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully',
      key,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Update setting error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update setting' }, 
      { status: 500 }
    )
  }
}