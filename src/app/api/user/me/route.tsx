/**
 * API Route: Get current user data from Prisma
 * Backend only - Prisma accessible ici
 */

import { NextResponse } from 'next/server'
import { createSSRSassClient } from '@/lib/supabase/server'
import {prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 1. Vérifier l'authentification Supabase
    const supabase = await createSSRSassClient()
    const client = supabase.getSupabaseClient()
    
    const { data: { user: supabaseUser }, error: authError } = await client.auth.getUser()

    if (authError || !supabaseUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Récupérer le user depuis Prisma (avec app_id filtré automatiquement)
    const prismaUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id }
    })

    if (!prismaUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // 3. Retourner les données user
    return NextResponse.json({
      id: prismaUser.id,
      app_id: prismaUser.app_id,
      email: prismaUser.email,
      name: prismaUser.name,
      avatar_url: prismaUser.avatar_url,
      role: prismaUser.role,
      created_at: prismaUser.created_at,
      updated_at: prismaUser.updated_at,
      last_login_at: prismaUser.last_login_at,
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}