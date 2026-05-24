const express = require('express');
const router  = express.Router();
const CertificateTemplate = require('../models/CertificateTemplate');
const auth           = require('../middleware/auth');
const { checkRoles } = require('../middleware/checkRole');
const logActivity    = require('../utils/activityLogger');

const adminOrPresident = checkRoles('Admin', 'President');
const adminOnly        = checkRoles('Admin');

const VALID_TYPES = ['appreciation', 'recognition-officer', 'recognition-committee', 'participation'];

// GET /api/certificates/templates?academicYear=2025-2026
router.get('/templates', auth, async (req, res) => {
  try {
    const { academicYear } = req.query;
    const query = { isActive: true };
    if (academicYear) query.academicYear = academicYear;

    const templates = await CertificateTemplate.find(query)
      .populate('createdBy', 'name role')
      .sort({ updatedAt: -1 });

    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/certificates/templates
router.post('/templates', auth, adminOrPresident, async (req, res) => {
  try {
    const { certType, academicYear, backgroundImage, fontFamily, bodyFontFamily, nameColor, bodyColor } = req.body;

    if (!VALID_TYPES.includes(certType))
      return res.status(400).json({ message: 'Invalid certificate type.' });
    if (!backgroundImage)
      return res.status(400).json({ message: 'Background image is required.' });

    const template = await CertificateTemplate.create({
      certType, academicYear, backgroundImage,
      ...(fontFamily     && { fontFamily }),
      ...(bodyFontFamily && { bodyFontFamily }),
      ...(nameColor      && { nameColor }),
      ...(bodyColor      && { bodyColor }),
      createdBy: req.user._id,
    });

    await logActivity(req.user._id, 'CREATE', 'Certificates',
      `Configured ${certType} certificate template for AY ${academicYear}`,
      { templateId: template._id, certType }
    );

    const populated = await CertificateTemplate.findById(template._id).populate('createdBy', 'name role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/certificates/templates/:id
router.put('/templates/:id', auth, adminOrPresident, async (req, res) => {
  try {
    const template = await CertificateTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('createdBy', 'name role');

    if (!template) return res.status(404).json({ message: 'Template not found' });

    await logActivity(req.user._id, 'UPDATE', 'Certificates',
      `Updated ${template.certType} certificate template for AY ${template.academicYear}`,
      { templateId: template._id, certType: template.certType }
    );

    res.json(template);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/certificates/templates/:id
router.delete('/templates/:id', auth, adminOnly, async (req, res) => {
  try {
    const template = await CertificateTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });

    await logActivity(req.user._id, 'DELETE', 'Certificates',
      `Deleted ${template.certType} certificate template for AY ${template.academicYear}`,
      { templateId: req.params.id }
    );

    res.json({ message: 'Template deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/certificates/font?family=Playfair+Display&weight=700
// Proxies Google Fonts with an old iOS UA so the API returns a TTF src URL
router.get('/font', auth, async (req, res) => {
  try {
    const { family, weight } = req.query;
    if (!family) return res.status(400).json({ message: 'font family is required' });

    const weightPart = weight ? `:${weight}` : '';
    const cssUrl = `https://fonts.googleapis.com/css?family=${encodeURIComponent(family)}${weightPart}`;

    // Old iOS 4 Safari UA — Google Fonts returns TTF format for this UA
    const cssRes = await fetch(cssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 4_3_3 like Mac OS X) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5',
      },
      signal: AbortSignal.timeout(10000),
    });
    const cssText = await cssRes.text();

    // Match any fonts.gstatic.com URL in the CSS — handles local() sources before url()
    const match = cssText.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
    if (!match) {
      console.error('[font proxy] No gstatic URL found. CSS snippet:', cssText.slice(0, 400));
      return res.status(404).json({ message: `Font URL not found for "${family}". Google may have changed the format.` });
    }

    const fontRes = await fetch(match[1], { signal: AbortSignal.timeout(15000) });
    const fontBuf = await fontRes.arrayBuffer();

    res.set('Content-Type', 'font/ttf');
    res.set('Cache-Control', 'public, max-age=604800'); // 7 days
    res.send(Buffer.from(fontBuf));
  } catch (err) {
    console.error('[font proxy] error:', err.message);
    res.status(500).json({ message: `Failed to load font "${req.query.family}": ${err.message}` });
  }
});

// POST /api/certificates/log-generate
router.post('/log-generate', auth, async (req, res) => {
  try {
    const { certType, recipientName, templateId } = req.body;
    await logActivity(req.user._id, 'GENERATE', 'Certificates',
      `Generated ${certType} certificate for "${recipientName}"`,
      { templateId, certType, recipientName }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;