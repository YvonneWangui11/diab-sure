import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RetentionPolicy {
  id: string
  data_type: string
  retention_days: number
  is_active: boolean
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting data retention check...')

    // Fetch active retention policies
    const { data: policies, error: policiesError } = await supabase
      .from('data_retention_policies')
      .select('*')
      .eq('is_active', true)

    if (policiesError) {
      console.error('Error fetching policies:', policiesError)
      throw policiesError
    }

    let totalFlagged = 0

    // Process each policy
    for (const policy of policies as RetentionPolicy[]) {
      console.log(`Checking ${policy.data_type} with ${policy.retention_days} days retention...`)
      
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days)

      let oldRecords: any[] = []
      let dateField = 'created_at'

      // Query old records based on data type
      switch (policy.data_type) {
        case 'glucose_readings':
          const { data: glucose } = await supabase
            .from('glucose_readings')
            .select('id, patient_id')
            .lt(dateField, cutoffDate.toISOString())
          oldRecords = glucose || []
          break

        case 'meal_logs':
          const { data: meals } = await supabase
            .from('meal_logs')
            .select('id, patient_id')
            .lt(dateField, cutoffDate.toISOString())
          oldRecords = meals || []
          break

        case 'exercise_logs':
          const { data: exercise } = await supabase
            .from('exercise_logs')
            .select('id, patient_id')
            .lt(dateField, cutoffDate.toISOString())
          oldRecords = exercise || []
          break

        case 'medication_logs':
          const { data: medLogs } = await supabase
            .from('medication_logs')
            .select('id, patient_id')
            .lt(dateField, cutoffDate.toISOString())
          oldRecords = medLogs || []
          break

        case 'appointments':
          const { data: appts } = await supabase
            .from('appointments')
            .select('id, patient_id')
            .lt(dateField, cutoffDate.toISOString())
          oldRecords = appts || []
          break

        case 'prescriptions':
          const { data: prescriptions } = await supabase
            .from('prescriptions')
            .select('id, patient_id')
            .lt(dateField, cutoffDate.toISOString())
          oldRecords = prescriptions || []
          break

        case 'audit_logs':
          const { data: audits } = await supabase
            .from('audit_logs')
            .select('id, actor_id')
            .lt(dateField, cutoffDate.toISOString())
          oldRecords = audits?.map(r => ({ ...r, patient_id: r.actor_id })) || []
          break
      }

      console.log(`Found ${oldRecords.length} old records for ${policy.data_type}`)

      // Flag old records that haven't been flagged yet
      for (const record of oldRecords) {
        // Check if already flagged
        const { data: existingFlag } = await supabase
          .from('data_retention_flags')
          .select('id')
          .eq('data_type', policy.data_type)
          .eq('record_id', record.id)
          .eq('action_taken', 'pending')
          .maybeSingle()

        if (!existingFlag) {
          const { error: flagError } = await supabase
            .from('data_retention_flags')
            .insert({
              data_type: policy.data_type,
              record_id: record.id,
              user_id: record.patient_id,
              action_taken: 'pending'
            })

          if (flagError) {
            console.error(`Error flagging record:`, flagError)
          } else {
            totalFlagged++
          }
        }
      }
    }

    console.log(`Data retention check complete. Flagged ${totalFlagged} records.`)

    return new Response(
      JSON.stringify({
        success: true,
        totalFlagged,
        message: `Successfully flagged ${totalFlagged} records for review`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in data retention check:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
