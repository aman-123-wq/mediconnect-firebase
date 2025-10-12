import fs from 'fs';

export default async function verifyCredentials(req, res) {
  try {
    const serviceAccountPath = './server/mediconnect-hms-firebase-adminsdk-fbsvc-6916c072bf.json';
    
    if (!fs.existsSync(serviceAccountPath)) {
      return res.json({ error: 'Service account file not found', path: serviceAccountPath });
    }

    const content = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(content);

    // Check if all required fields are present
    const requiredFields = ['project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);

    res.json({
      fileExists: true,
      fileSize: content.length,
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKeyPresent: !!serviceAccount.private_key,
      privateKeyStarts: serviceAccount.private_key ? serviceAccount.private_key.substring(0, 50) + '...' : 'MISSING',
      missingFields: missingFields,
      isValid: missingFields.length === 0
    });

  } catch (error) {
    res.json({
      error: error.message,
      details: 'The service account file might be corrupted'
    });
  }
}