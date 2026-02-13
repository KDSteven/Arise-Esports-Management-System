export const exportToCSV = (data, filename = 'members.csv') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = [
    'Student ID',
    'First Name',
    'Last Name',
    'Email',
    'Phone Number',
    'Course',
    'Year Level',
    'Academic Year',
    'Status',
    'Has Paid',
    'Amount Paid',
    'Payment Date',
    'Registration Date',
    'Remarks'
  ];

  const csvContent = [
    headers.join(','),
    ...data.map(member => [
      member.studentId,
      member.firstName,
      member.lastName,
      member.email,
      member.phoneNumber || '',
      member.course,
      member.yearLevel,
      member.academicYear,
      member.status,
      member.hasPaid ? 'Yes' : 'No',
      member.amountPaid || 0,
      member.paymentDate ? new Date(member.paymentDate).toLocaleDateString() : '',
      new Date(member.registrationDate).toLocaleDateString(),
      member.remarks || ''
    ].map(field => `"${field}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount || 0);
};