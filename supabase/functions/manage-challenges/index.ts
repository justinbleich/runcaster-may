// Supabase Edge Function to manage weekly challenges
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

// Check if environment variables are set
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  try {
    // Check authorization - this should be secured in production
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Extract parameters from request
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'auto'
    
    // Default response
    let result
    
    // Handle different actions
    switch (action) {
      case 'auto':
        // Call the database function to manage challenges automatically
        const { data, error } = await supabase.rpc('manage_weekly_challenges')
        if (error) throw error
        result = { success: true, data, message: 'Auto challenge management completed' }
        break
        
      case 'list':
        // List active challenges
        const { data: challenges, error: listError } = await supabase
          .from('challenges')
          .select('*')
          .order('created_at', { ascending: false })
        if (listError) throw listError
        result = { success: true, data: challenges }
        break
        
      case 'create':
        // Create a new challenge of specified type
        const challengeType = url.searchParams.get('type') || 'weekly_distance'
        const { data: newChallenge, error: createError } = await supabase
          .rpc('create_new_challenge', { challenge_type: challengeType })
        if (createError) throw createError
        result = { success: true, data: newChallenge, message: `New ${challengeType} challenge created` }
        break
        
      case 'close':
        // Close a specific challenge and calculate rankings
        const challengeId = url.searchParams.get('id')
        if (!challengeId) {
          throw new Error('Challenge ID is required for close action')
        }
        
        // Update challenge to inactive
        const { error: updateError } = await supabase
          .from('challenges')
          .update({ is_active: false })
          .eq('id', challengeId)
        if (updateError) throw updateError
        
        // Calculate rankings
        const { error: rankError } = await supabase
          .rpc('calculate_challenge_rankings', { challenge_id: challengeId })
        if (rankError) throw rankError
        
        result = { success: true, message: `Challenge ${challengeId} closed and rankings calculated` }
        break
        
      default:
        throw new Error(`Unknown action: ${action}`)
    }
    
    // Return success response
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (err) {
    // Log the error
    console.error('Error managing challenges:', err)
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err.message || 'An error occurred while managing challenges'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}) 