describe('Student Dashboard E2E Tests', () => {
  beforeEach(() => {
    // Mock authentication as student
    cy.intercept('POST', '**/auth/login.php', {
      statusCode: 200,
      body: {
        success: true,
        token: 'student-token',
        user: {
          id: 3,
          name: 'Student User',
          email: 'student@example.com',
          role: 'student'
        }
      }
    });

    cy.intercept('GET', '**/auth/verify.php*', {
      statusCode: 200,
      body: {
        valid: true,
        user: {
          id: 3,
          name: 'Student User',
          email: 'student@example.com',
          role: 'student'
        }
      }
    });

    // Mock student courses
    cy.intercept('GET', '**/courses/getByStudent.php*', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Mathematics', description: 'Advanced Math', teacher_name: 'Dr. Smith' },
        { id: 2, name: 'Physics', description: 'Physics 101', teacher_name: 'Dr. Jones' }
      ]
    }).as('getStudentCourses');

    cy.visit('/login');
    cy.get('input[name="email"]').type('student@example.com');
    cy.get('input[name="password"]').type('student123');
    cy.get('button[type="submit"]').click();
  });

  it('should display student dashboard', () => {
    cy.url().should('include', '/student');
    cy.contains('Student Dashboard').should('be.visible');
  });

  it('should display enrolled courses', () => {
    cy.visit('/student/courses');
    cy.wait('@getStudentCourses');
    cy.contains('Mathematics').should('be.visible');
    cy.contains('Physics').should('be.visible');
    cy.contains('Dr. Smith').should('be.visible');
    cy.contains('Dr. Jones').should('be.visible');
  });

  it('should view course details', () => {
    cy.visit('/student/courses');
    cy.wait('@getStudentCourses');

    cy.intercept('GET', '**/laboratories/getByCourse.php*', {
      statusCode: 200,
      body: [
        { id: 1, title: 'Lab 1', description: 'First laboratory', course_id: 1 }
      ]
    });

    cy.contains('Mathematics').click();
    cy.url().should('include', '/course-assignments');
  });
});

