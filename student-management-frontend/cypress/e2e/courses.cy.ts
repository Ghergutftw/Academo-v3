describe('Courses Management E2E Tests', () => {
  beforeEach(() => {
    // Mock authentication as admin
    cy.intercept('POST', '**/auth/login.php', {
      statusCode: 200,
      body: {
        success: true,
        token: 'admin-token',
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin'
        }
      }
    });

    // Mock courses API
    cy.intercept('GET', '**/courses/getAll.php', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Mathematics', description: 'Advanced Math', teacher_id: 1, teacher_name: 'Dr. Smith' },
        { id: 2, name: 'Physics', description: 'Physics 101', teacher_id: 2, teacher_name: 'Dr. Jones' }
      ]
    }).as('getCourses');

    // Mock teachers API
    cy.intercept('GET', '**/teachers/getAll.php', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Dr. Smith', email: 'smith@example.com' },
        { id: 2, name: 'Dr. Jones', email: 'jones@example.com' }
      ]
    });

    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@example.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
  });

  it('should display courses list', () => {
    cy.visit('/admin/courses');
    cy.wait('@getCourses');
    cy.contains('Mathematics').should('be.visible');
    cy.contains('Physics').should('be.visible');
  });

  it('should create new course', () => {
    cy.intercept('POST', '**/courses/create.php', {
      statusCode: 200,
      body: { id: 3, name: 'Chemistry', description: 'Chemistry 101', teacher_id: 1 }
    }).as('createCourse');

    cy.visit('/admin/courses');
    cy.wait('@getCourses');
    cy.contains('Add Course').click();

    cy.get('input[name="name"]').type('Chemistry');
    cy.get('textarea[name="description"]').type('Chemistry 101');
    cy.get('select[name="teacher_id"]').select('1');
    cy.get('button[type="submit"]').click();

    cy.wait('@createCourse');
  });

  it('should update course', () => {
    cy.intercept('POST', '**/courses/update.php', {
      statusCode: 200,
      body: { success: true }
    }).as('updateCourse');

    cy.visit('/admin/courses');
    cy.wait('@getCourses');
    cy.get('.btn-edit').first().click();

    cy.get('input[name="name"]').clear().type('Advanced Mathematics');
    cy.get('button[type="submit"]').click();

    cy.wait('@updateCourse');
  });

  it('should delete course', () => {
    cy.intercept('POST', '**/courses/delete.php', {
      statusCode: 200,
      body: { success: true }
    }).as('deleteCourse');

    cy.visit('/admin/courses');
    cy.wait('@getCourses');
    cy.get('.btn-delete').first().click();
    cy.get('.btn-confirm').click();

    cy.wait('@deleteCourse');
  });
});
describe('Students Management E2E Tests', () => {
  beforeEach(() => {
    // Mock authentication as admin
    cy.intercept('POST', '**/auth/login.php', {
      statusCode: 200,
      body: {
        success: true,
        token: 'admin-token',
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin'
        }
      }
    });

    // Mock students API
    cy.intercept('GET', '**/students/getAll.php', {
      statusCode: 200,
      body: [
        { id: 1, name: 'John Doe', email: 'john@example.com', group_id: 1, group_name: 'Group A' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', group_id: 1, group_name: 'Group A' }
      ]
    }).as('getStudents');

    // Mock groups API
    cy.intercept('GET', '**/groups/getAll.php', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Group A' },
        { id: 2, name: 'Group B' }
      ]
    });

    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@example.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
  });

  it('should display students list', () => {
    cy.visit('/admin/students');
    cy.wait('@getStudents');
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jane Smith').should('be.visible');
  });

  it('should open add student modal', () => {
    cy.visit('/admin/students');
    cy.wait('@getStudents');
    cy.contains('Add Student').click();
    cy.get('.modal').should('be.visible');
  });

  it('should create new student', () => {
    cy.intercept('POST', '**/students/create.php', {
      statusCode: 200,
      body: { id: 3, name: 'New Student', email: 'new@example.com', group_id: 1 }
    }).as('createStudent');

    cy.visit('/admin/students');
    cy.wait('@getStudents');
    cy.contains('Add Student').click();

    cy.get('input[name="name"]').type('New Student');
    cy.get('input[name="email"]').type('new@example.com');
    cy.get('select[name="group_id"]').select('1');
    cy.get('button[type="submit"]').click();

    cy.wait('@createStudent');
    cy.get('.modal').should('not.exist');
  });

  it('should edit existing student', () => {
    cy.intercept('POST', '**/students/update.php', {
      statusCode: 200,
      body: { success: true }
    }).as('updateStudent');

    cy.visit('/admin/students');
    cy.wait('@getStudents');
    cy.get('.btn-edit').first().click();

    cy.get('input[name="name"]').clear().type('Updated Name');
    cy.get('button[type="submit"]').click();

    cy.wait('@updateStudent');
  });

  it('should delete student', () => {
    cy.intercept('POST', '**/students/delete.php', {
      statusCode: 200,
      body: { success: true }
    }).as('deleteStudent');

    cy.visit('/admin/students');
    cy.wait('@getStudents');
    cy.get('.btn-delete').first().click();
    cy.get('.btn-confirm').click();

    cy.wait('@deleteStudent');
  });

  it('should filter students by search', () => {
    cy.visit('/admin/students');
    cy.wait('@getStudents');

    cy.get('input[placeholder*="Search"]').type('John');
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jane Smith').should('not.be.visible');
  });
});

