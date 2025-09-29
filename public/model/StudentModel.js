export class StudentModel {
    department = "";
    courseNumber = "";
    courseName = "";
  
    setDetails({ department, courseNumber, courseName }) {
      this.department = department;
      this.courseNumber = courseNumber;
      this.courseName = courseName;
    }
  }
  