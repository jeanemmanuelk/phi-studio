/* ================================================
   THE SYMBOL φ STUDIO — Configuration
   ================================================
   Fill in your Supabase and Cloudinary details below.
   See SETUP.md for step-by-step instructions.
   ================================================ */

const CONFIG = {
  supabase: {
    url:     'https://kgatzmlojgwoefegbvoy.supabase.co',        // e.g. https://abcdefgh.supabase.co
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYXR6bWxvamd3b2VmZWdidm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzEyODgsImV4cCI6MjA4OTI0NzI4OH0.BuI3aeOjwIYqcm_X5pR1K_tSYNENDx_qGu9f5P1O47M'    // found in Settings > API > Project API keys
  },
  cloudinary: {
    cloudName:    'dh3qxoivm',     // found on your Cloudinary dashboard
    uploadPreset: 'phi_studio'           // the unsigned upload preset you created
  }
};
