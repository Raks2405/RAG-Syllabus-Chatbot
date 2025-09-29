export class ProfessorModel {
    pdfFile;
    department;
    courseNumber;
    courseName;
    pdfUrl;
    email;
    timestamp;
    syllabusText; 
  
    constructor() {
      this.pdfFile = null;
    }
  
    toFirestore() {
      return {
        department: this.department,
        courseNumber: this.courseNumber,
        courseName: this.courseName,
        pdfUrl: this.pdfUrl,
        email: this.email,
        timestamp: this.timestamp,
        syllabusText: this.syllabusText, 
      };
    }
  }
  