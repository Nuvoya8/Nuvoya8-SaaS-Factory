/**
 * API Route de Test N8N
 * Endpoint SIMPLIFIÉ pour tester UNIQUEMENT la communication avec N8N
 * Pas d'authentification pour faciliter les tests
 */

import { NextRequest, NextResponse } from 'next/server'
import { n8n } from '@/lib/n8n/client'

export async function POST(req: NextRequest) {
  try {
    // Récupérer les données du body
    const body = await req.json()
    const { message } = body

    console.log('📤 Envoi vers N8N:', { message })

    // Appeler le workflow N8N
    const result = await n8n.custom('test-workflow', {
      message: message || 'Hello from Nuvoya8 Factory!',
      timestamp: new Date().toISOString(),
    }, {
      userId: 'test-user',
      timeout: 10000, // 10 secondes
    })

    console.log('📥 Réponse de N8N:', JSON.stringify(result, null, 2))

    return NextResponse.json({
      success: true,
      fullResult: result,           // TOUT ce que N8N retourne
      data: result.data,             // Les données spécifiques
      appId: process.env.NEXT_PUBLIC_APP_ID,
    })
  } catch (error: any) {
    console.error('❌ Erreur N8N:', error)
    
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

