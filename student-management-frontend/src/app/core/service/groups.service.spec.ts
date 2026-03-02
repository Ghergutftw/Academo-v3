import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GroupsService } from './groups.service';
import { Group } from '../../shared/models/group.model';
import { environment } from '../../environments/environment';

describe('GroupsService', () => {
  let service: GroupsService;
  let httpMock: HttpTestingController;

  const mockGroup: Group = {
    id: 1,
    name: 'Group A',
    year: 1
  };

  const mockGroups: Group[] = [
    mockGroup,
    { id: 2, name: 'Group B', year: 2 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GroupsService]
    });

    service = TestBed.inject(GroupsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should retrieve all groups', () => {
      service.getAll().subscribe(groups => {
        expect(groups).toEqual(mockGroups);
        expect(groups.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/student_groups/getAll.php`);
      expect(req.request.method).toBe('GET');
      req.flush(mockGroups);
    });
  });

  describe('create', () => {
    it('should create a new group', () => {
      const newGroup = {
        name: 'Group C',
        year: 3
      };

      service.create(newGroup).subscribe(group => {
        expect(group).toEqual({ ...newGroup, id: 3 });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/student_groups/create.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newGroup);
      req.flush({ ...newGroup, id: 3 });
    });
  });

  describe('update', () => {
    it('should update an existing group', () => {
      const updatedGroup: Group = {
        ...mockGroup,
        name: 'Updated Group A'
      };

      service.update(updatedGroup).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/student_groups/update.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(updatedGroup);
      req.flush({ success: true });
    });
  });

  describe('delete', () => {
    it('should delete a group by id', () => {
      const groupId = 1;

      service.delete(groupId).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/student_groups/delete.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ id: groupId });
      req.flush({ success: true });
    });
  });
});
