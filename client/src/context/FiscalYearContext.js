import React, { createContext, useState, useContext } from 'react';

export const FiscalYearContext = createContext();

// Compute default academic year based on current date
// Aug–Dec → current year is start; Jan–Jul → previous year is start
function getDefaultAcademicYear() {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth() + 1; // 1-indexed
  const start = mo >= 8 ? yr : yr - 1;
  return `${start}-${start + 1}`;
}

// Generate a list of selectable academic years (past 3 + next 1)
export function generateYearOptions() {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth() + 1;
  const currentStart = mo >= 8 ? yr : yr - 1;
  const options = [];
  for (let i = currentStart + 1; i >= currentStart - 2; i--) {
    options.push(`${i}-${i + 1}`);
  }
  return options;
}

function getDefaultSemester() {
  const mo = new Date().getMonth() + 1; // 1-indexed
  // Aug–Dec = 1st Semester; Jan–Jul = 2nd Semester
  return mo >= 8 ? '1st' : '2nd';
}

export const FiscalYearProvider = ({ children }) => {
  const [academicYear, setAcademicYear] = useState(() => {
    return localStorage.getItem('arise_academic_year') || getDefaultAcademicYear();
  });

  const [currentSemester, setCurrentSemester] = useState(() => {
    return localStorage.getItem('arise_semester') || getDefaultSemester();
  });

  const changeAcademicYear = (year) => {
    localStorage.setItem('arise_academic_year', year);
    setAcademicYear(year);
  };

  const changeSemester = (sem) => {
    localStorage.setItem('arise_semester', sem);
    setCurrentSemester(sem);
  };

  return (
    <FiscalYearContext.Provider value={{
      academicYear, changeAcademicYear, yearOptions: generateYearOptions(),
      currentSemester, changeSemester, semesterOptions: ['1st', '2nd'],
    }}>
      {children}
    </FiscalYearContext.Provider>
  );
};

export const useFiscalYear = () => useContext(FiscalYearContext);