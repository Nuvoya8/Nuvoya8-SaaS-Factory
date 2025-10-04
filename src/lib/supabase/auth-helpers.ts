/**
 * SUPABASE AUTH HELPERS - Multi-Tenant
 * 
 * Wrappers autour de Supabase Auth qui ajoutent automatiquement l'app_id
 * SIMPLE: Mêmes noms de colonnes partout (snake_case)
 */

import { createAuditLog, getCurrentAppId } from '@/lib/prisma'

const APP_ID = process.env.NEXT_PUBLIC_APP_ID!
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME!

// ============================================
// SIGN UP avec app_id
// ============================================

export interface SignUpParams {
  email: string
  password: string
  name?: string
  redirectTo?: string
}

export async function signUpWithEmail(supabase: any, params: SignUpParams) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        app_id: APP_ID,
        name: params.name || params.email,
        app_name: APP_NAME,
      },
      emailRedirectTo: params.redirectTo || `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Sign up error:', error)
    throw error
  }

  if (data.user) {
    await createAuditLog({
      user_id: data.user.id,
      action: 'user.signup',
      entity: 'user',
      entity_id: data.user.id,
      metadata: {
        email: params.email,
        method: 'email',
      },
    })
  }

  return data
}

// ============================================
// SIGN IN avec tracking
// ============================================

export interface SignInParams {
  email: string
  password: string
}

export async function signInWithEmail(supabase: any, params: SignInParams) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  })

  if (error) {
    console.error('Sign in error:', error)
    throw error
  }

  if (data.user) {
    const user_app_id = data.user.user_metadata?.app_id
    
    if (user_app_id !== APP_ID) {
      await supabase.auth.signOut()
      throw new Error('User does not belong to this application')
    }

    await updateLastLogin(data.user.id)

    await createAuditLog({
      user_id: data.user.id,
      action: 'user.signin',
      entity: 'user',
      entity_id: data.user.id,
      metadata: {
        email: params.email,
        method: 'email',
      },
    })
  }

  return data
}

// ============================================
// OAUTH SIGN IN avec app_id
// ============================================

export interface OAuthParams {
  provider: 'google' | 'github'
  redirectTo?: string
}

export async function signInWithOAuth(supabase: any, params: OAuthParams) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: params.provider,
    options: {
      redirectTo: params.redirectTo || `${window.location.origin}/auth/callback`,
      queryParams: {
        app_id: APP_ID,
        app_name: APP_NAME,
      },
    },
  })

  if (error) {
    console.error('OAuth error:', error)
    throw error
  }

  return data
}

// ============================================
// SIGN OUT
// ============================================

export async function signOut(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await createAuditLog({
      user_id: user.id,
      action: 'user.signout',
      entity: 'user',
      entity_id: user.id,
    })
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

// ============================================
// PASSWORD RESET
// ============================================

export async function resetPassword(supabase: any, email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) {
    console.error('Reset password error:', error)
    throw error
  }
}

export async function updatePassword(supabase: any, newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    console.error('Update password error:', error)
    throw error
  }

  if (data.user) {
    await createAuditLog({
      user_id: data.user.id,
      action: 'user.password_updated',
      entity: 'user',
      entity_id: data.user.id,
    })
  }

  return data
}

// ============================================
// HELPER: Update last login
// ============================================

async function updateLastLogin(user_id: string) {
  try {
    const response = await fetch('/api/auth/update-last-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id }),
    })
    
    if (!response.ok) {
      console.error('Failed to update last login')
    }
  } catch (error) {
    console.error('Error updating last login:', error)
  }
}

// ============================================
// GET CURRENT USER (avec vérification app_id)
// ============================================

export async function getCurrentUser(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const user_app_id = user.user_metadata?.app_id
  
  if (user_app_id !== APP_ID) {
    console.warn('User does not belong to this app, signing out')
    await supabase.auth.signOut()
    return null
  }

  return user
}

// ============================================
// CHECK AUTH STATUS
// ============================================

export async function checkAuthStatus(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { isAuthenticated: false, user: null }
  }

  const user = await getCurrentUser(supabase)
  
  return {
    isAuthenticated: !!user,
    user,
  }
}