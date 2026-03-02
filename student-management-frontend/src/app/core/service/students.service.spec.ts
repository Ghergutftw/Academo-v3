import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StudentsService } from './students.service';
import { Student } from '../../shared/models/student.model';
import { environment } from '../../environments/environment';

describe('StudentsService', () => {
  let service: StudentsService;
  let httpMock: HttpTestingController;

  const mockStudent: Student = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    group_name: 1
  };

  const mockStudents: Student[] = [
    mockStudent,
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', group_name: 1 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StudentsService]
    });

    service = TestBed.inject(StudentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should retrieve all students', () => {
      service.getAll().subscribe(students => {
        expect(students).toEqual(mockStudents);
        expect(students.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/students/getAll.php`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStudents);
    });
  });

  describe('getByGroup', () => {
    it('should retrieve students by group id', () => {
      const groupId = 1;

      service.getByGroup(groupId).subscribe(students => {
        expect(students).toEqual(mockStudents);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/students/getByGroup.php?group_id=${groupId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStudents);
    });
  });

  describe('create', () => {
    it('should create a new student', () => {
      const newStudent: Partial<Student> = {
        name: 'New Student',
        email: 'new@example.com',
        group_name: 1
      };

      service.create(newStudent as Student).subscribe(student => {
        expect(student).toEqual({ ...newStudent, id: 3 });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/students/create.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newStudent);
      req.flush({ ...newStudent, id: 3 });
    });
  });

  describe('update', () => {
    it('should update an existing student', () => {
      const updatedStudent: Student = {
        ...mockStudent,
        name: 'Updated Name'
      };

      service.update(updatedStudent).subscribe(student => {
        expect(student).toEqual(updatedStudent);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/students/update.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(updatedStudent);
      req.flush(updatedStudent);
    });
  });

  describe('delete', () => {
    it('should delete a student by id', () => {
      const studentId = 1;

      service.delete(studentId).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/students/delete.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ id: studentId });
      req.flush({ success: true });
    });
  });

  describe('importExcel', () => {
    it('should import students from excel without updating duplicates', () => {
      service.importExcel(mockStudents, false).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/students/importExcel.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ students: mockStudents, updateDuplicates: false });
      req.flush({ success: true });
    });

    it('should import students from excel with updating duplicates', () => {
      service.importExcel(mockStudents, true).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/students/importExcel.php`);
      expect(req.request.body).toEqual({ students: mockStudents, updateDuplicates: true });
      req.flush({ success: true });
    });
  });
});
