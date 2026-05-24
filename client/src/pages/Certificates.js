import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { AuthContext } from '../context/AuthContext';
import { FiscalYearContext } from '../context/FiscalYearContext';
import { useToast } from '../context/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCertificate, faPenToSquare, faDownload,
  faSpinner, faImage, faCheckCircle, faCircleXmark,
  faRulerCombined,
} from '@fortawesome/free-solid-svg-icons';
import './Certificates.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api';

// ── Shared date segments (same pattern for all cert types) ────────
// Segments: { text, bold } — bold=true → UPPERCASE + bold weight in PDF
const buildDateSegs = (f) => [
  { text: 'Given this day of ', bold: false },
  { text: f.day,   bold: true },
  { text: ', ',    bold: false },
  { text: f.month, bold: true },
  { text: ' ',     bold: false },
  { text: f.year,  bold: true },
  { text: ', at ', bold: false },
  { text: f.place, bold: true },
  { text: '.',     bold: false },
];

// ── 4 hardcoded certificate types ─────────────────────────────────
const CERT_TYPES = [
  {
    key: 'appreciation',
    title: 'CERTIFICATE',
    subtitle: 'OF APPRECIATION',
    buildBodySegments: (f) => [
      { text: 'for showing and sharing his/her valuable knowledge as a ', bold: false },
      { text: f.position,  bold: true },
      { text: ' in the held ', bold: false },
      { text: f.eventName, bold: true },
      { text: ' with the theme ', bold: false },
      { text: f.theme,     bold: true },
      { text: '.',         bold: false },
    ],
    buildDateSegments: buildDateSegs,
    fields: [
      { key: 'position',  label: 'Position / Role',  placeholder: 'e.g. Resource Speaker' },
      { key: 'eventName', label: 'Event Name',        placeholder: 'e.g. Tech Summit 2025' },
      { key: 'theme',     label: 'Theme',             placeholder: 'e.g. Innovate for the Future' },
      { key: 'day',       label: 'Day',               placeholder: '15' },
      { key: 'month',     label: 'Month',             placeholder: 'April' },
      { key: 'year',      label: 'Year',              placeholder: '2025' },
      { key: 'place',     label: 'Place of Event',    placeholder: 'e.g. City College of Calamba' },
    ],
  },
  {
    key: 'recognition-officer',
    title: 'CERTIFICATE',
    subtitle: 'OF RECOGNITION',
    qualifier: 'For Position Held',
    buildBodySegments: (f) => [
      { text: 'for his/her invaluable service to the organization and institution as ', bold: false },
      { text: f.position,     bold: true },
      { text: ' of ',         bold: false },
      { text: f.organization, bold: true },
      { text: ' for Academic Year ', bold: false },
      { text: f.academicYear, bold: true },
      { text: '.',            bold: false },
    ],
    buildDateSegments: buildDateSegs,
    fields: [
      { key: 'position',     label: 'Position',       placeholder: 'e.g. President' },
      { key: 'organization', label: 'Organization',   placeholder: 'e.g. ARISE Esports' },
      { key: 'academicYear', label: 'Academic Year',  placeholder: 'e.g. 2024-2025' },
      { key: 'day',          label: 'Day',            placeholder: '15' },
      { key: 'month',        label: 'Month',          placeholder: 'April' },
      { key: 'year',         label: 'Year',           placeholder: '2025' },
      { key: 'place',        label: 'Place',          placeholder: 'e.g. City College of Calamba' },
    ],
  },
  {
    key: 'recognition-committee',
    title: 'CERTIFICATE',
    subtitle: 'OF RECOGNITION',
    qualifier: 'For Event Contribution',
    buildBodySegments: (f) => [
      { text: 'for exerting his/her valuable time and effort as a ', bold: false },
      { text: f.role,      bold: true },
      { text: ' in the held ', bold: false },
      { text: f.eventName, bold: true },
      { text: ' with the theme ', bold: false },
      { text: f.theme,     bold: true },
      { text: '.',         bold: false },
    ],
    buildDateSegments: buildDateSegs,
    fields: [
      { key: 'role',      label: 'Committee / Volunteer Role', placeholder: 'e.g. Head of Logistics' },
      { key: 'eventName', label: 'Event Name',                 placeholder: 'e.g. Arise Cup 2025' },
      { key: 'theme',     label: 'Theme',                      placeholder: 'e.g. Rise Together' },
      { key: 'day',       label: 'Day',                        placeholder: '15' },
      { key: 'month',     label: 'Month',                      placeholder: 'April' },
      { key: 'year',      label: 'Year',                       placeholder: '2025' },
      { key: 'place',     label: 'Place of Event',             placeholder: 'e.g. City College of Calamba' },
    ],
  },
  {
    key: 'participation',
    title: 'CERTIFICATE',
    subtitle: 'OF PARTICIPATION',
    buildBodySegments: (f) => [
      { text: 'for his/her active participation in the held ', bold: false },
      { text: f.eventName, bold: true },
      { text: ' with the theme ', bold: false },
      { text: f.theme,     bold: true },
      { text: '.',         bold: false },
    ],
    buildDateSegments: buildDateSegs,
    fields: [
      { key: 'eventName', label: 'Event Name',     placeholder: 'e.g. Arise Cup 2025' },
      { key: 'theme',     label: 'Theme',           placeholder: 'e.g. Rise Together' },
      { key: 'day',       label: 'Day',             placeholder: '15' },
      { key: 'month',     label: 'Month',           placeholder: 'April' },
      { key: 'year',      label: 'Year',            placeholder: '2025' },
      { key: 'place',     label: 'Place of Event',  placeholder: 'e.g. City College of Calamba' },
    ],
  },
];

const TYPE_LABELS = {
  'appreciation':          'Certificate of Appreciation',
  'recognition-officer':   'Certificate of Recognition\n(Officer Service)',
  'recognition-committee': 'Certificate of Recognition\n(Committee / Volunteer)',
  'participation':         'Certificate of Participation',
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// All available fonts — null googleFamily = jsPDF built-in (no fetch needed)
const FONTS = [
  { key: 'times',      label: 'Times New Roman',       jsPdfName: 'times',             googleFamily: null,                  weight: null,  hasBold: true  },
  { key: 'helvetica',  label: 'Arial / Helvetica',      jsPdfName: 'helvetica',         googleFamily: null,                  weight: null,  hasBold: true  },
  { key: 'courier',    label: 'Courier New',            jsPdfName: 'courier',           googleFamily: null,                  weight: null,  hasBold: true  },
  { key: 'playfair',   label: 'Playfair Display',       jsPdfName: 'PlayfairDisplay',   googleFamily: 'Playfair Display',    weight: '700', hasBold: true  },
  { key: 'cinzel',     label: 'Cinzel',                 jsPdfName: 'Cinzel',            googleFamily: 'Cinzel',              weight: '700', hasBold: true  },
  { key: 'garamond',   label: 'EB Garamond',            jsPdfName: 'EBGaramond',        googleFamily: 'EB Garamond',         weight: '700', hasBold: true  },
  { key: 'cormorant',  label: 'Cormorant Garamond',     jsPdfName: 'CormorantGaramond', googleFamily: 'Cormorant Garamond',  weight: '700', hasBold: true  },
  { key: 'montserrat', label: 'Montserrat',             jsPdfName: 'Montserrat',        googleFamily: 'Montserrat',          weight: '700', hasBold: true  },
  { key: 'lato',       label: 'Lato',                   jsPdfName: 'Lato',              googleFamily: 'Lato',                weight: '700', hasBold: true  },
  { key: 'lexend',     label: 'Lexend',                 jsPdfName: 'Lexend',            googleFamily: 'Lexend',              weight: '700', hasBold: true  },
  { key: 'greatvibes', label: 'Great Vibes (Script)',   jsPdfName: 'GreatVibes',        googleFamily: 'Great Vibes',         weight: '400', hasBold: false },
];

const CSS_FONTS = {
  times:      '"Times New Roman", Times, serif',
  helvetica:  'Arial, Helvetica, sans-serif',
  courier:    '"Courier New", Courier, monospace',
  playfair:   '"Playfair Display", serif',
  cinzel:     'Cinzel, serif',
  garamond:   '"EB Garamond", serif',
  cormorant:  '"Cormorant Garamond", serif',
  montserrat: 'Montserrat, sans-serif',
  lato:       'Lato, sans-serif',
  lexend:     'Lexend, sans-serif',
  greatvibes: '"Great Vibes", cursive',
};

// Module-level cache: key → base64 TTF string (persists across renders)
const fontCache = new Map();

const hexToRgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const emptySetup = {
  academicYear:    '',
  backgroundImage: '',
  fontFamily:      'times',
  bodyFontFamily:  'times',
  nameColor:       '#1a3a6e',
  bodyColor:       '#374151',
};

const emptyIssueFields = {};

// Fetches a Google Font TTF via the server proxy, registers it with the jsPDF doc
const loadFont = async (doc, fontCfg) => {
  if (!fontCfg.googleFamily) return; // built-in — nothing to do

  if (!fontCache.has(fontCfg.key)) {
    const params = `family=${encodeURIComponent(fontCfg.googleFamily)}${fontCfg.weight ? `&weight=${fontCfg.weight}` : ''}`;
    const res = await axios.get(`${API_URL}/certificates/font?${params}`, { responseType: 'arraybuffer' });
    const bytes = new Uint8Array(res.data);
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    fontCache.set(fontCfg.key, btoa(binary));
  }

  const base64   = fontCache.get(fontCfg.key);
  const filename = `${fontCfg.jsPdfName}.ttf`;
  doc.addFileToVFS(filename, base64);
  doc.addFont(filename, fontCfg.jsPdfName, 'normal');
  if (fontCfg.hasBold) doc.addFont(filename, fontCfg.jsPdfName, 'bold');
};

// Renders [{text, bold}] segments with mixed weight, centered, with word wrap.
// Field values are bold; connecting text is normal weight.
// Returns the Y position after the last rendered line.
const renderSegments = (doc, segments, fontName, hasBold, fontSize, colorRgb, startY, lineSpacing, maxWidth) => {
  const fullText = segments.map(s => s.text).join('');
  const charBold = [];
  for (const seg of segments) {
    for (const _ch of seg.text) charBold.push(seg.bold);
  }

  // Use normal weight for word-wrap measurement (consistent baseline)
  doc.setFont(fontName, 'normal');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(fullText, maxWidth);

  doc.setTextColor(...colorRgb);
  let cursor = 0;
  let y = startY;

  for (const line of lines) {
    const len = line.length;
    const lineBold = charBold.slice(cursor, cursor + len);
    cursor += len;
    // Skip the word-break space(s) that splitTextToSize consumed
    while (cursor < fullText.length && fullText[cursor] === ' ') cursor++;

    // Group consecutive characters into runs of same bold value
    const runs = [];
    for (let i = 0; i < len; i++) {
      const b = lineBold[i] && hasBold;
      if (!runs.length || runs[runs.length - 1].bold !== b) {
        runs.push({ text: '', bold: b });
      }
      runs[runs.length - 1].text += line[i];
    }

    // Measure total rendered width of this line
    let totalW = 0;
    for (const run of runs) {
      doc.setFont(fontName, run.bold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      totalW += doc.getTextWidth(run.text);
    }

    // Render each run, starting from the centered X position
    let x = 148.5 - totalW / 2;
    for (const run of runs) {
      doc.setFont(fontName, run.bold ? 'bold' : 'normal');
      doc.text(run.text, x, y);
      x += doc.getTextWidth(run.text);
    }

    y += lineSpacing;
  }
  return y;
};

// ── Component ─────────────────────────────────────────────────────
const Certificates = () => {
  const { user }         = useContext(AuthContext);
  const { academicYear } = useContext(FiscalYearContext);
  const { showToast }    = useToast();

  const isManager = ['Admin', 'President'].includes(user?.role);

  const [activeTab, setActiveTab]   = useState(isManager ? 'templates' : 'issue');
  const [configs, setConfigs]       = useState([]);   // loaded from DB
  const [loading, setLoading]       = useState(true);

  // Setup modal (per type)
  const [setupType, setSetupType]   = useState(null); // CERT_TYPES entry
  const [setupId, setSetupId]       = useState(null); // existing template _id if editing
  const [setupForm, setSetupForm]   = useState({ ...emptySetup });
  const [bgWarn, setBgWarn]         = useState(false);
  const [saving, setSaving]         = useState(false);

  // Issue form
  const [issueType, setIssueType]   = useState(null); // CERT_TYPES entry
  const [issueFields, setIssueFields] = useState({});
  const [recipientName, setRecipientName] = useState('');
  const [generating, setGenerating] = useState(false);

  // ── Date field helpers ────────────────────────────────────────
  const fieldsToDateValue = () => {
    const { day, month, year } = issueFields;
    if (!day || !month || !year) return '';
    const mi = MONTHS.indexOf(month);
    if (mi === -1) return '';
    return `${year}-${String(mi + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleDateChange = (dateStr) => {
    if (!dateStr) {
      setIssueFields(p => ({ ...p, day: '', month: '', year: '' }));
      return;
    }
    const [y, m, d] = dateStr.split('-');
    setIssueFields(p => ({
      ...p,
      day:   String(parseInt(d, 10)),
      month: MONTHS[parseInt(m, 10) - 1],
      year:  y,
    }));
  };

  // ── Fetch configs for current academic year ───────────────────
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/certificates/templates?academicYear=${academicYear}`);
      setConfigs(res.data);
    } catch {
      showToast('error', 'Failed to load certificate configurations.');
    } finally {
      setLoading(false);
    }
  }, [academicYear, showToast]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  // Get config for a specific type key
  const getConfig = (typeKey) => configs.find(c => c.certType === typeKey) || null;

  // ── Open setup modal ──────────────────────────────────────────
  const openSetup = (typeEntry) => {
    const existing = getConfig(typeEntry.key);
    setSetupType(typeEntry);
    if (existing) {
      setSetupId(existing._id);
      setSetupForm({
        academicYear:    existing.academicYear,
        backgroundImage: existing.backgroundImage,
        fontFamily:      existing.fontFamily      || 'times',
        bodyFontFamily:  existing.bodyFontFamily  || 'times',
        nameColor:       existing.nameColor       || '#1a3a6e',
        bodyColor:       existing.bodyColor       || '#374151',
      });
    } else {
      setSetupId(null);
      setSetupForm({ ...emptySetup, academicYear });
    }
    setBgWarn(false);
  };

  const closeSetup = () => {
    setSetupType(null);
    setSetupId(null);
    setSetupForm({ ...emptySetup });
  };

  // ── Background image upload ───────────────────────────────────
  const handleBgUpload = (file) => {
    if (!file) return;
    setBgWarn(file.size > 2 * 1024 * 1024);
    const reader = new FileReader();
    reader.onload = (e) => setSetupForm(p => ({ ...p, backgroundImage: e.target.result }));
    reader.readAsDataURL(file);
  };

  // ── Save config ───────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!setupForm.backgroundImage) return showToast('error', 'Please upload the certificate background image.');
    setSaving(true);
    try {
      const payload = { ...setupForm, certType: setupType.key };
      if (setupId) {
        await axios.put(`${API_URL}/certificates/templates/${setupId}`, payload);
      } else {
        await axios.post(`${API_URL}/certificates/templates`, payload);
      }
      showToast('success', `${TYPE_LABELS[setupType.key].replace('\n', ' ')} configured.`);
      closeSetup();
      fetchConfigs();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  // ── Select type for issuing ───────────────────────────────────
  const selectIssueType = (typeEntry) => {
    const cfg = getConfig(typeEntry.key);
    if (!cfg) return showToast('error', 'This certificate type has not been configured yet. Ask an Admin or President to set it up.');
    setIssueType(typeEntry);
    setIssueFields({});
    setRecipientName('');
  };

  // ── Generate PDF ──────────────────────────────────────────────
  const generateCertificate = async () => {
    const cfg = getConfig(issueType.key);
    if (!recipientName.trim()) return showToast('error', 'Recipient name is required.');
    for (const f of issueType.fields) {
      if (f.key === 'month' || f.key === 'year') continue;
      const label = f.key === 'day' ? 'Date' : f.label;
      if (!issueFields[f.key]?.trim()) return showToast('error', `"${label}" is required.`);
    }

    setGenerating(true);
    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // landscape A4: 297 × 210 mm

      // Background image (full page)
      const fmt = cfg.backgroundImage.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(cfg.backgroundImage, fmt, 0, 0, 297, 210);

      // Uppercase all field values so they appear capitalized in the cert
      const ucFields = Object.fromEntries(
        Object.entries(issueFields).map(([k, v]) => [k, (v || '').toUpperCase()])
      );

      let nameFontCfg = FONTS.find(f => f.key === (cfg.fontFamily     || 'times')) || FONTS[0];
      let bodyFontCfg = FONTS.find(f => f.key === (cfg.bodyFontFamily || 'times')) || FONTS[0];
      const [nr, ng, nb] = hexToRgb(cfg.nameColor || '#1a3a6e');
      const [br, bg, bb] = hexToRgb(cfg.bodyColor  || '#374151');

      try {
        await loadFont(doc, nameFontCfg);
      } catch (fontErr) {
        console.error('Name font load failed:', fontErr);
        showToast('warning', `Could not load "${nameFontCfg.label}" — falling back to Times New Roman for name.`);
        nameFontCfg = FONTS[0];
      }

      if (bodyFontCfg.key !== nameFontCfg.key) {
        try {
          await loadFont(doc, bodyFontCfg);
        } catch (fontErr) {
          console.error('Citation font load failed:', fontErr);
          showToast('warning', `Could not load "${bodyFontCfg.label}" — falling back to Times New Roman for citation.`);
          bodyFontCfg = FONTS[0];
        }
      }

      // Recipient Name — large, bold, uppercase
      doc.setFont(nameFontCfg.jsPdfName, nameFontCfg.hasBold ? 'bold' : 'normal');
      doc.setFontSize(48);
      doc.setTextColor(nr, ng, nb);
      doc.text(recipientName.trim().toUpperCase(), 148.5, 108, { align: 'center' });

      // Body text — field values UPPERCASE+BOLD, connecting text normal weight
      const bodySegs = issueType.buildBodySegments(ucFields);
      const afterBodyY = renderSegments(
        doc, bodySegs,
        bodyFontCfg.jsPdfName, bodyFontCfg.hasBold,
        13, [br, bg, bb], 130, 7, 210
      );

      // Date line — field values UPPERCASE+BOLD, connecting text normal weight
      const dateSegs = issueType.buildDateSegments(ucFields);
      renderSegments(
        doc, dateSegs,
        bodyFontCfg.jsPdfName, bodyFontCfg.hasBold,
        12, [br, bg, bb], afterBodyY + 10, 7, 210
      );

      const filename = `certificate_${recipientName.trim().replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);

      // Audit log (fire-and-forget)
      axios.post(`${API_URL}/certificates/log-generate`, {
        certType: issueType.key,
        recipientName: recipientName.trim(),
        templateId: cfg._id,
      }).catch(() => {});

      showToast('success', 'Certificate downloaded!');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Layout Guide JPG ──────────────────────────────────────────
  const generateLayoutGuide = () => {
    // A4 landscape at 150 DPI → 1754 × 1240 px
    const scale = 150 / 25.4; // px per mm
    const W = Math.round(297 * scale);
    const H = Math.round(210 * scale);
    const p = (mm) => Math.round(mm * scale);

    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f8f8f4';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold ${p(4)}px Arial, sans-serif`;
    ctx.fillText('CERTIFICATE TEMPLATE LAYOUT GUIDE', W / 2, p(10));

    ctx.fillStyle = '#64748b';
    ctx.font = `${p(2.6)}px Arial, sans-serif`;
    ctx.fillText(
      'Canvas: 297 mm × 210 mm (A4 Landscape)  |  Recommended: 2480 × 1754 px @ 300 DPI  |  Minimum: 1240 × 877 px',
      W / 2, p(16)
    );

    // Center guide line (dashed)
    ctx.save();
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 1;
    ctx.setLineDash([p(2), p(2)]);
    ctx.beginPath();
    ctx.moveTo(p(148.5), p(18));
    ctx.lineTo(p(148.5), p(200));
    ctx.stroke();
    ctx.restore();

    // Helper: colored zone with solid header strip + border
    const zone = (label, detail, x1, y1, x2, y2, color) => {
      const rx = p(x1), ry = p(y1), rw = p(x2 - x1), rh = p(y2 - y1);
      const hh = p(6);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.fillStyle = color;
      ctx.fillRect(rx, ry, rw, hh);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.font = `bold ${p(2.4)}px Arial, sans-serif`;
      ctx.fillText(label, rx + p(2), ry + p(4.5));
      ctx.fillStyle = color;
      ctx.font = `${p(1.9)}px Arial, sans-serif`;
      ctx.fillText(detail, rx + p(2), ry + rh - p(1.5));
    };

    // Zone 1 — Recipient Name (y=108)
    zone('RECIPIENT NAME', 'y = 108 mm  |  48pt bold Times  |  color #1A3A6E (navy)  |  UPPERCASE + BOLD',
      18, 95, 279, 115, '#1a3a6e');

    // Zone 3 — Body text (y=130, wraps)
    zone('BODY TEXT', 'y starts 130 mm  |  13pt bold Times  |  max-width 210 mm  |  each line +7 mm  |  UPPERCASE + BOLD',
      40, 126, 257, 158, '#056430');
    ctx.fillStyle = '#056430';
    ctx.font = `italic ${p(1.9)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('* Leave this entire area blank — height varies with body text length', W / 2, p(160));

    // Zone 4 — Date line (y≈161–171)
    zone('DATE LINE', 'y ≈ 152–165 mm (shifts with body length)  |  12pt bold Times  |  UPPERCASE + BOLD',
      55, 161, 242, 171, '#6b21a8');

    // Y-axis ruler
    ctx.strokeStyle = '#b4b4b4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p(10), p(18)); ctx.lineTo(p(10), p(200));
    ctx.stroke();
    ctx.fillStyle = '#969696';
    ctx.font = `${p(1.7)}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('mm', p(7), p(17));
    [20, 40, 60, 83, 95, 108, 115, 126, 130, 158, 161, 171, 200].forEach(mm => {
      ctx.strokeStyle = '#b4b4b4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p(8), p(mm)); ctx.lineTo(p(12), p(mm));
      ctx.stroke();
      ctx.fillStyle = '#969696';
      ctx.font = `${p(1.7)}px Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(`${mm}`, p(13), p(mm) + p(0.6));
    });

    // Legend
    const legendItems = [
      ['Recipient name',       '#1a3a6e'],
      ['Body text (variable)', '#056430'],
      ['Date line',            '#6b21a8'],
    ];
    let lx = p(20);
    const ly = p(205);
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold ${p(2)}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('LEGEND:', lx, ly);
    lx += p(14);
    legendItems.forEach(([label, color]) => {
      ctx.fillStyle = color;
      ctx.fillRect(lx, ly - p(3.5), p(4), p(4));
      ctx.fillStyle = '#1e293b';
      ctx.font = `${p(2)}px Arial, sans-serif`;
      ctx.fillText(label, lx + p(5.5), ly);
      lx += p(46);
    });

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificate_layout_guide.jpg';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.92);
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="cert-page">

      <h1 className="cert-page-title">
        <FontAwesomeIcon icon={faCertificate} />
        Certificates
      </h1>
      <p className="cert-page-sub">
        Configure templates per type and issue certificates for members and events.
      </p>

      {/* Tabs */}
      <div className="cert-tabs">
        {isManager && (
          <button className={`cert-tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}>
            Templates
          </button>
        )}
        <button className={`cert-tab-btn ${activeTab === 'issue' ? 'active' : ''}`}
          onClick={() => setActiveTab('issue')}>
          Issue Certificate
        </button>
      </div>

      {/* ── Templates Tab ── */}
      {activeTab === 'templates' && isManager && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p className="cert-ay-note" style={{ margin: 0 }}>
              Configuring templates for <strong>{academicYear}</strong>. Change the academic year in the sidebar to configure other years.
            </p>
            <button className="cert-btn-ghost" onClick={generateLayoutGuide} style={{ marginLeft: 16, whiteSpace: 'nowrap' }}>
              <FontAwesomeIcon icon={faRulerCombined} />
              Download Layout Guide
            </button>
          </div>

          {loading ? (
            <div className="cert-loading">
              <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '1.4rem' }} />
              Loading...
            </div>
          ) : (
            <div className="cert-type-grid">
              {CERT_TYPES.map(t => {
                const cfg = getConfig(t.key);
                return (
                  <div key={t.key} className={`cert-type-card ${cfg ? 'cert-type-card--ready' : 'cert-type-card--empty'}`}>
                    {/* Thumbnail */}
                    <div className="cert-type-thumb">
                      {cfg?.backgroundImage
                        ? <img src={cfg.backgroundImage} alt={t.subtitle} />
                        : <FontAwesomeIcon icon={faImage} />
                      }
                    </div>

                    {/* Info */}
                    <div className="cert-type-body">
                      <div className="cert-type-name">
                        {t.title}<br />
                        <span>{t.subtitle}</span>
                        {t.qualifier && <span className="cert-type-qualifier">{t.qualifier}</span>}
                      </div>

                      <div className={`cert-type-status ${cfg ? 'cert-type-status--ok' : 'cert-type-status--missing'}`}>
                        <FontAwesomeIcon icon={cfg ? faCheckCircle : faCircleXmark} />
                        {cfg ? `Configured · ${cfg.academicYear}` : 'Not configured'}
                      </div>

                      <button className="cert-btn-primary cert-type-btn" onClick={() => openSetup(t)}>
                        <FontAwesomeIcon icon={faPenToSquare} />
                        {cfg ? 'Update' : 'Set Up'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Issue Certificate Tab ── */}
      {activeTab === 'issue' && (
        <div className="cert-issue-wrap">

          {/* Step 1: choose type */}
          {!issueType && (
            <>
              <p className="cert-step-label">Step 1 — Select certificate type</p>
              <div className="cert-type-select-grid">
                {CERT_TYPES.map(t => {
                  const cfg = getConfig(t.key);
                  return (
                    <button
                      key={t.key}
                      className={`cert-type-select-card ${!cfg ? 'cert-type-select-card--disabled' : ''}`}
                      onClick={() => selectIssueType(t)}
                      disabled={!cfg}
                    >
                      <FontAwesomeIcon icon={faCertificate} className="cert-select-icon" />
                      <span className="cert-select-title">{t.title}</span>
                      <span className="cert-select-sub">{t.subtitle}</span>
                      {t.qualifier && <span className="cert-select-qualifier">{t.qualifier}</span>}
                      {!cfg && <span className="cert-select-badge">Not configured</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Step 2: fill details + preview */}
          {issueType && (
            <div className="cert-issue-layout">
              {/* Left: form */}
              <div className="cert-issue-form-card">
                <div className="cert-issue-form-header">
                  <div>
                    <p className="cert-step-label" style={{ margin: 0 }}>Step 2 — Fill in details</p>
                    <p className="cert-issue-type-name">
                      {issueType.title} {issueType.subtitle}
                      {issueType.qualifier && <span className="cert-issue-qualifier"> — {issueType.qualifier}</span>}
                    </p>
                  </div>
                  <button className="cert-btn-ghost" onClick={() => setIssueType(null)}>
                    ← Back
                  </button>
                </div>

                {/* Recipient */}
                <div className="cert-form-group">
                  <label>Recipient Name *</label>
                  <input
                    type="text"
                    placeholder="Full name as it should appear"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                  />
                </div>

                {/* Type-specific fields */}
                {issueType.fields.map(f => {
                  if (f.key === 'month' || f.key === 'year') return null;
                  if (f.key === 'day') return (
                    <div className="cert-form-group" key="date">
                      <label>Date *</label>
                      <input
                        type="date"
                        value={fieldsToDateValue()}
                        onChange={e => handleDateChange(e.target.value)}
                      />
                    </div>
                  );
                  return (
                    <div className="cert-form-group" key={f.key}>
                      <label>{f.label} *</label>
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        value={issueFields[f.key] || ''}
                        onChange={e => setIssueFields(p => ({ ...p, [f.key]: e.target.value }))}
                      />
                    </div>
                  );
                })}

                <button
                  className="cert-btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                  onClick={generateCertificate}
                  disabled={generating}
                >
                  {generating
                    ? <><FontAwesomeIcon icon={faSpinner} spin /> Generating...</>
                    : <><FontAwesomeIcon icon={faDownload} /> Download Certificate PDF</>
                  }
                </button>
              </div>

              {/* Right: preview */}
              <div className="cert-preview-card">
                <p className="cert-preview-label">Preview</p>
                <div className="cert-preview-shell">
                  {(() => {
                    const cfg = getConfig(issueType.key);
                    return (
                      <div
                        className="cert-preview-canvas"
                        style={{ backgroundImage: cfg ? `url(${cfg.backgroundImage})` : 'none', justifyContent: 'flex-start', paddingTop: '18%' }}
                      >
                        {(() => {
                          const pNameFont = CSS_FONTS[cfg?.fontFamily]     || CSS_FONTS.times;
                          const pBodyFont = CSS_FONTS[cfg?.bodyFontFamily] || CSS_FONTS.times;
                          const pNameColor = cfg?.nameColor || '#1a3a6e';
                          const pBodyColor = cfg?.bodyColor  || '#374151';
                          const pf = issueType.fields.reduce((acc, f) => ({
                            ...acc,
                            [f.key]: (issueFields[f.key] || `[${f.label}]`).toUpperCase(),
                          }), {});
                          return (
                            <>
                              <p className="cert-preview-name" style={{ color: pNameColor, fontFamily: pNameFont }}>
                                {recipientName ? recipientName.toUpperCase() : 'RECIPIENT NAME'}
                              </p>
                              <p className="cert-preview-body" style={{ color: pBodyColor, fontFamily: pBodyFont }}>
                                {issueType.buildBodySegments(pf).map((seg, i) =>
                                  seg.bold
                                    ? <strong key={i}>{seg.text}</strong>
                                    : <span key={i}>{seg.text}</span>
                                )}
                              </p>
                              <p className="cert-preview-body" style={{ color: pBodyColor, fontFamily: pBodyFont, marginTop: 4, fontStyle: 'italic' }}>
                                {issueType.buildDateSegments(pf).map((seg, i) =>
                                  seg.bold
                                    ? <strong key={i}>{seg.text}</strong>
                                    : <span key={i}>{seg.text}</span>
                                )}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>
                <p className="cert-preview-note">
                  Layout preview only. The PDF will be A4 landscape with full background.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Setup Modal ── */}
      {setupType && (
        <div className="cert-overlay" onClick={e => { if (e.target === e.currentTarget) closeSetup(); }}>
          <div className="cert-modal">
            <div className="cert-modal-header">
              <h2>
                {setupId ? 'Update' : 'Set Up'} — {setupType.title} {setupType.subtitle}
              </h2>
              <button className="cert-modal-close" onClick={closeSetup}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="cert-modal-body">

                <div className="cert-form-group">
                  <label>Academic Year *</label>
                  <input
                    type="text"
                    placeholder="e.g. 2025-2026"
                    value={setupForm.academicYear}
                    onChange={e => setSetupForm(p => ({ ...p, academicYear: e.target.value }))}
                    required
                  />
                </div>

                {/* Background image */}
                <div className="cert-form-group">
                  <label>
                    Certificate Background Image *
                    <span className="cert-label-hint">
                      Upload your certificate design (JPG/PNG). Leave the name area blank — text is overlaid automatically.
                      Recommended: 2480 × 1754 px (A4 landscape).
                    </span>
                  </label>
                  <div className="cert-upload-area">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={e => handleBgUpload(e.target.files[0])}
                    />
                    {setupForm.backgroundImage
                      ? <img className="cert-upload-preview" src={setupForm.backgroundImage} alt="Preview" />
                      : (
                        <>
                          <FontAwesomeIcon icon={faImage} style={{ color: '#94a3b8', fontSize: '1.8rem' }} />
                          <p className="cert-upload-hint">Click to upload or drag & drop</p>
                          <p className="cert-upload-hint">JPG or PNG · Max recommended 2 MB</p>
                        </>
                      )
                    }
                  </div>
                  {bgWarn && (
                    <p className="cert-upload-warn">Image is over 2 MB — may slow PDF generation.</p>
                  )}
                </div>

                {/* Typography */}
                <div className="cert-section-label" style={{ marginTop: 20 }}>Typography</div>

                <div className="cert-color-row" style={{ marginBottom: 14 }}>
                  <div className="cert-form-group" style={{ margin: 0 }}>
                    <label>Name Font</label>
                    <select
                      value={setupForm.fontFamily}
                      onChange={e => setSetupForm(p => ({ ...p, fontFamily: e.target.value }))}
                    >
                      <optgroup label="Built-in">
                        {FONTS.filter(f => !f.googleFamily).map(f => (
                          <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Google Fonts">
                        {FONTS.filter(f => f.googleFamily).map(f => (
                          <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div className="cert-form-group" style={{ margin: 0 }}>
                    <label>Citation Font</label>
                    <select
                      value={setupForm.bodyFontFamily}
                      onChange={e => setSetupForm(p => ({ ...p, bodyFontFamily: e.target.value }))}
                    >
                      <optgroup label="Built-in">
                        {FONTS.filter(f => !f.googleFamily).map(f => (
                          <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Google Fonts">
                        {FONTS.filter(f => f.googleFamily).map(f => (
                          <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="cert-color-row">
                  <div className="cert-form-group" style={{ margin: 0 }}>
                    <label>Name Color</label>
                    <div className="cert-color-wrap">
                      <input
                        type="color"
                        value={setupForm.nameColor}
                        onChange={e => setSetupForm(p => ({ ...p, nameColor: e.target.value }))}
                      />
                      <span className="cert-color-hex">{setupForm.nameColor}</span>
                    </div>
                  </div>
                  <div className="cert-form-group" style={{ margin: 0 }}>
                    <label>Body &amp; Date Color</label>
                    <div className="cert-color-wrap">
                      <input
                        type="color"
                        value={setupForm.bodyColor}
                        onChange={e => setSetupForm(p => ({ ...p, bodyColor: e.target.value }))}
                      />
                      <span className="cert-color-hex">{setupForm.bodyColor}</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="cert-modal-footer">
                <button type="button" className="cert-btn-ghost" onClick={closeSetup}>Cancel</button>
                <button type="submit" className="cert-btn-primary" disabled={saving}>
                  {saving
                    ? <><FontAwesomeIcon icon={faSpinner} spin /> Saving...</>
                    : 'Save Configuration'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Certificates;