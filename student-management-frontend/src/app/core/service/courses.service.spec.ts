import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CoursesService, Course } from './courses.service';
import { environment } from '../../environments/environment';

describe('CoursesService', () => {
  let service: CoursesService;
  let httpMock: HttpTestingController;

  const mockCourse: Course = {
    id: 1,
    name: 'Mathematics',
    description: 'Advanced Mathematics',
    teacher_id: 1,
    teacher_name: 'Dr. Smith'
  };

  const mockCourses: Course[] = [
    mockCourse,
    { id: 2, name: 'Physics', description: 'Physics 101', teacher_id: 2, teacher_name: 'Dr. Jones' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CoursesService]
    });

    service = TestBed.inject(CoursesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should retrieve all courses', () => {
      service.getAll().subscribe(courses => {
        expect(courses).toEqual(mockCourses);
        expect(courses.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/courses/getAll.php`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCourses);
    });
  });

  describe('getByTeacher', () => {
    it('should retrieve courses by teacher id', () => {
      const teacherId = 1;

      service.getByTeacher(teacherId).subscribe(courses => {
        expect(courses.length).toBe(1);
        expect(courses[0].teacher_id).toBe(teacherId);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/courses/getByTeacher.php?teacher_id=${teacherId}`);
      expect(req.request.method).toBe('GET');
      req.flush([mockCourse]);
    });
  });

  describe('getByStudent', () => {
    it('should retrieve courses by student id', () => {
      const studentId = 1;

      service.getByStudent(studentId).subscribe(courses => {
        expect(courses).toEqual(mockCourses);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/courses/getByStudent.php?student_id=${studentId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCourses);
    });
  });

  describe('create', () => {
    it('should create a new course', () => {
      const newCourse: Course = {
        name: 'Chemistry',
        description: 'Chemistry 101',
        teacher_id: 1
      };

      service.create(newCourse).subscribe(course => {
        expect(course).toEqual({ ...newCourse, id: 3 });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/courses/create.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCourse);
      req.flush({ ...newCourse, id: 3 });
    });
  });

  describe('update', () => {
    it('should update an existing course', () => {
      const updatedCourse: Course = {
        ...mockCourse,
        name: 'Advanced Mathematics'
      };

      service.update(updatedCourse).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/courses/update.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(updatedCourse);
      req.flush({ success: true });
    });
  });

  describe('delete', () => {
    it('should delete a course by id', () => {
      const courseId = 1;

      service.delete(courseId).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/courses/delete.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ id: courseId });
      req.flush({ success: true });
    });
  });

  describe('importExcel', () => {
    it('should import courses from excel', () => {
      service.importExcel(mockCourses, false).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/courses/importExcel.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ courses: mockCourses, updateDuplicates: false });
      req.flush({ success: true });
    });
  });
});

