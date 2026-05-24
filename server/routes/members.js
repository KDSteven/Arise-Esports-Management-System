const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { checkRoles } = require('../middleware/checkRole');
const logActivity = require('../utils/activityLogger');

// @route   GET /api/members
// @desc    Get all members (with filtering options)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { academicYear, hasPaid, status, search, semester } = req.query;

    // Build query
    let query = {};

    if (academicYear) {
      query.academicYear = academicYear;
    }

    if (hasPaid !== undefined) {
      const semKey = semester === '2' ? 'sem2.hasPaid' : 'sem1.hasPaid';
      query[semKey] = hasPaid === 'true';
    }

    // 1st semester view: only show members who registered in 1st semester.
    // 2nd semester view: show all members (1st + 2nd semester registrants).
    if (semester === '1') {
      query.registrationSemester = '1st';
    }

    if (status) {
      query.status = status;
    }
    
    // Search by name or student ID
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const members = await Member.find(query).sort({ registrationDate: -1 });
    
    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/members/retention
// @desc    Cross-year retention analytics
// @access  Admin, President
router.get('/retention', auth, checkRoles('Admin', 'President'), async (req, res) => {
  try {
    const { previousYear, currentYear } = req.query;
    if (!previousYear || !currentYear) {
      return res.status(400).json({ message: 'previousYear and currentYear are required' });
    }

    const [prevOfficial, currAll] = await Promise.all([
      Member.find({ academicYear: previousYear, status: 'Official Member' },
        'studentId firstName lastName course yearLevel'),
      Member.find({ academicYear: currentYear }, 'studentId'),
    ]);

    const currIds = new Set(currAll.map(m => m.studentId));
    const prevIds = new Set(prevOfficial.map(m => m.studentId));

    const returning   = prevOfficial.filter(m =>  currIds.has(m.studentId));
    const lapsed      = prevOfficial.filter(m => !currIds.has(m.studentId));
    const newCount    = currAll.filter(m => !prevIds.has(m.studentId)).length;

    res.json({
      previousYear,
      currentYear,
      previousOfficialCount: prevOfficial.length,
      returningCount: returning.length,
      lapsedCount: lapsed.length,
      newMembersCount: newCount,
      retentionRate: prevOfficial.length > 0
        ? Math.round((returning.length / prevOfficial.length) * 100)
        : null,
      lapsedMembers: lapsed,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/members/:id
// @desc    Get member by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    res.json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/members
// @desc    Add a new member
// @access  Admin, Secretary only
router.post(
  '/',
  [
    auth,
    checkRoles('Admin', 'Secretary'),
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('course').notEmpty().withMessage('Course is required'),
    body('yearLevel').isIn(['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']).withMessage('Invalid year level'),
    body('academicYear').notEmpty().withMessage('Academic year is required')
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { studentId, firstName, lastName, email, phoneNumber, course, yearLevel, academicYear, registrationSemester } = req.body;

      // Check if student ID already exists
      let existingMember = await Member.findOne({ studentId });
      if (existingMember) {
        return res.status(400).json({ message: 'Student ID already exists' });
      }

      // Create new member
      const member = new Member({
        studentId,
        firstName,
        lastName,
        email,
        phoneNumber,
        course,
        yearLevel,
        academicYear,
        registrationSemester: registrationSemester || '1st',
      });

      await member.save();

      await logActivity(req.user._id, 'CREATE', 'Members',
        `Added member ${member.firstName} ${member.lastName} (${member.studentId})`,
        { memberId: member._id }
      );

      res.status(201).json(member);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/members/:id
// @desc    Update member details
// @access  Admin, Secretary only
router.put('/:id', auth, checkRoles('Admin', 'Secretary'), async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, course, yearLevel, academicYear, remarks } = req.body;

    let member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Update fields
    if (firstName) member.firstName = firstName;
    if (lastName) member.lastName = lastName;
    if (email) member.email = email;
    if (phoneNumber !== undefined) member.phoneNumber = phoneNumber;
    if (course) member.course = course;
    if (yearLevel) member.yearLevel = yearLevel;
    if (academicYear) member.academicYear = academicYear;
    if (remarks !== undefined) member.remarks = remarks;

    await member.save();

    await logActivity(req.user._id, 'UPDATE', 'Members',
      `Updated member ${member.firstName} ${member.lastName} (${member.studentId})`,
      { memberId: member._id }
    );

    res.json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/members/:id/payment
// @desc    Update payment status
// @access  Private
router.put('/:id/payment', auth, async (req, res) => {
  try {
    const { hasPaid, amountPaid, paymentDate, semester } = req.body;
    const sem = semester === '2' ? 'sem2' : 'sem1';
    const semLabel = sem === 'sem2' ? '2nd Sem' : '1st Sem';

    let member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const wasAlreadyPaid = member[sem].hasPaid;

    member[sem].hasPaid = hasPaid;
    if (hasPaid) {
      member[sem].amountPaid  = amountPaid || 0;
      member[sem].paymentDate = paymentDate || new Date();
      // Never promote a rejected member — rejection is set explicitly by admin
      if (member.status !== 'Rejected') {
        member.status = 'Official Member';
      }
    } else {
      member[sem].amountPaid  = 0;
      member[sem].paymentDate = null;
      // Revert to Pending only when both semesters are unpaid and not rejected
      if (!member.sem1.hasPaid && !member.sem2.hasPaid && member.status !== 'Rejected') {
        member.status = 'Pending';
      }
    }

    // Mirror sem1 into flat fields for backward compatibility
    if (sem === 'sem1') {
      member.hasPaid     = member.sem1.hasPaid;
      member.amountPaid  = member.sem1.amountPaid;
      member.paymentDate = member.sem1.paymentDate;
    }

    await member.save();

    // Auto-record transaction in Finance when payment is marked as paid.
    // Use a date that falls within the member's own academic year so the
    // transaction is attributed to the correct year regardless of when the
    // payment is recorded in the system.
    const semRef = `${member.studentId}-${sem}`;
    if (hasPaid && !wasAlreadyPaid && member[sem].amountPaid > 0) {
      const [startYr] = member.academicYear.split('-').map(Number);
      const ayStart = new Date(startYr, 7, 1);
      const ayEnd   = new Date(startYr + 1, 7, 1);
      const pd      = new Date(member[sem].paymentDate);
      const txDate  = (pd >= ayStart && pd < ayEnd) ? pd : ayStart;

      await Transaction.create({
        type: 'Income',
        category: 'Membership Fee',
        amount: member[sem].amountPaid,
        description: `Membership fee (${semLabel}) — ${member.firstName} ${member.lastName} (${member.studentId})`,
        date: txDate,
        reference: semRef,
        createdBy: req.user._id,
      });
    }

    // Remove auto-created transaction if payment is reversed
    if (!hasPaid && wasAlreadyPaid) {
      await Transaction.deleteOne({
        category: 'Membership Fee',
        reference: semRef,
      });
    }

    if (hasPaid && !wasAlreadyPaid) {
      await logActivity(req.user._id, 'PAYMENT', 'Members',
        `Marked ${member.firstName} ${member.lastName} (${member.studentId}) as paid (${semLabel}) — ₱${member[sem].amountPaid}`,
        { memberId: member._id, amount: member[sem].amountPaid, semester: sem }
      );
    } else if (!hasPaid && wasAlreadyPaid) {
      await logActivity(req.user._id, 'PAYMENT', 'Members',
        `Reversed payment (${semLabel}) for ${member.firstName} ${member.lastName} (${member.studentId})`,
        { memberId: member._id, semester: sem }
      );
    }

    res.json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/members/:id/status
// @desc    Update member status
// @access  Admin, Secretary only
router.put('/:id/status', auth, checkRoles('Admin', 'Secretary'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'Official Member', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    let member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    member.status = status;
    await member.save();

    await logActivity(req.user._id, 'UPDATE', 'Members',
      `Changed status of ${member.firstName} ${member.lastName} (${member.studentId}) to ${status}`,
      { memberId: member._id, status }
    );

    res.json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/members/:id
// @desc    Delete a member
// @access  Admin only
router.delete('/:id', auth, checkRoles('Admin'), async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    await Member.findByIdAndDelete(req.params.id);

    await logActivity(req.user._id, 'DELETE', 'Members',
      `Deleted member ${member.firstName} ${member.lastName} (${member.studentId})`,
      { studentId: member.studentId }
    );

    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/members/stats/summary
// @desc    Get statistics summary
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { academicYear, semester } = req.query;
    const sem       = semester === '2' ? 'sem2' : 'sem1';
    const semPaidKey = `${sem}.hasPaid`;
    const semAmtKey  = `${sem}.amountPaid`;

    let query = {};
    if (academicYear) query.academicYear = academicYear;
    if (semester === '1') query.registrationSemester = '1st';

    const totalMembers    = await Member.countDocuments(query);
    const paidMembers     = await Member.countDocuments({ ...query, [semPaidKey]: true  });
    const unpaidMembers   = await Member.countDocuments({ ...query, [semPaidKey]: false });
    // Official = paid for this semester and not rejected; Pending = unpaid and not rejected
    const officialMembers = await Member.countDocuments({ ...query, [semPaidKey]: true,  status: { $ne: 'Rejected' } });
    const pendingMembers  = await Member.countDocuments({ ...query, [semPaidKey]: false, status: { $ne: 'Rejected' } });

    const revenueResult = await Member.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: `$${semAmtKey}` } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      totalMembers,
      paidMembers,
      unpaidMembers,
      officialMembers,
      pendingMembers,
      totalRevenue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/members/bulk-import
// @desc    Bulk import members from CSV
// @access  Admin, Secretary
router.post('/bulk-import', auth, checkRoles('Admin', 'Secretary'), async (req, res) => {
  try {
    const { members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'No members provided' });
    }

    const VALID_YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
    const VALID_STATUSES = ['Pending', 'Official Member', 'Rejected'];
    let created = 0, skipped = 0;
    const errors = [];

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      try {
        if (!m.studentId || !m.firstName || !m.lastName || !m.email || !m.course || !m.yearLevel || !m.academicYear) {
          errors.push({ row: i + 2, message: 'Missing required fields (studentId, firstName, lastName, email, course, yearLevel, academicYear)' });
          skipped++;
          continue;
        }
        if (!VALID_YEAR_LEVELS.includes(m.yearLevel)) {
          errors.push({ row: i + 2, message: `Invalid yearLevel "${m.yearLevel}". Must be one of: ${VALID_YEAR_LEVELS.join(', ')}` });
          skipped++;
          continue;
        }
        const exists = await Member.findOne({ studentId: m.studentId });
        if (exists) {
          errors.push({ row: i + 2, message: `Student ID "${m.studentId}" already exists` });
          skipped++;
          continue;
        }
        const importedPaid = m.hasPaid === 'true' || m.hasPaid === true;
        const VALID_SEMESTERS = ['1st', '2nd'];
        await Member.create({
          studentId:            m.studentId,
          firstName:            m.firstName,
          lastName:             m.lastName,
          email:                m.email,
          phoneNumber:          m.phoneNumber || '',
          course:               m.course,
          yearLevel:            m.yearLevel,
          academicYear:         m.academicYear,
          registrationSemester: VALID_SEMESTERS.includes(m.registrationSemester) ? m.registrationSemester : '1st',
          hasPaid:              importedPaid,
          sem1: { hasPaid: importedPaid, amountPaid: 0, paymentDate: null },
          sem2: { hasPaid: false,        amountPaid: 0, paymentDate: null },
          status: importedPaid
            ? 'Official Member'
            : (VALID_STATUSES.includes(m.status) ? m.status : 'Pending'),
          remarks: m.remarks || '',
        });
        created++;
      } catch (err) {
        errors.push({ row: i + 2, message: err.message });
        skipped++;
      }
    }

    await logActivity(req.user._id, 'IMPORT', 'Members',
      `Bulk imported members — ${created} created, ${skipped} skipped`,
      { created, skipped }
    );

    res.json({ created, skipped, errors });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;