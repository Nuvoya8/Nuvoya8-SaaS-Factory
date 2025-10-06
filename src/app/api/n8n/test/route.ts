/**
 * API Route de Test N8N
 * Endpoint pour tester la communication avec N8N
 */

import { NextRequest, NextResponse } from 'next/server'
import { n8n } from '@/lib/n8n/client'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'auth
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Récupérer les données du body
    const body = await req.json()
    const { message } = body

    // Appeler un workflow N8N custom pour le test
    const result = await n8n.custom('test-workflow', {
      message: message || 'Hello from Nuvoya8 Factory!',
      timestamp: new Date().toISOString(),
    }, {
      userId: session.user.id,
      timeout: 10000, // 10 secondes
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      appId: process.env.NEXT_PUBLIC_APP_ID,
      userId: session.user.id,
    })
  } catch (error: any) {
    console.error('N8N test error:', error)
    
    return NextResponse.json(
      { 
        error: 'N8N call failed',
        message: error.message,
        details: error.details 
      },
      { status: 500 }
    )
  }
}

