describe('Teacher Dashboard E2E Tests', () => {
  beforeEach(() => {
    // Mock authentication as teacher
    cy.intercept('POST', '**/auth/login.php', {
      statusCode: 200,
      body: {
        success: true,
        token: 'teacher-token',
        user: {
          id: 2,
          name: 'Teacher User',
          email: 'teacher@example.com',
          role: 'teacher'
        }
      }
    });

    cy.intercept('GET', '**/auth/verify.php*', {
      statusCode: 200,
      body: {
        valid: true,
        user: {
          id: 2,
          name: 'Teacher User',
          email: 'teacher@example.com',
          role: 'teacher'
        }
      }
    });

    // Mock teacher courses
    cy.intercept('GET', '**/courses/getByTeacher.php*', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Mathematics', description: 'Advanced Math', teacher_id: 2 },
        { id: 2, name: 'Physics', description: 'Physics 101', teacher_id: 2 }
      ]
    }).as('getTeacherCourses');

    cy.visit('/login');
    cy.get('input[name="email"]').type('teacher@example.com');
    cy.get('input[name="password"]').type('teacher123');
    cy.get('button[type="submit"]').click();
  });

  it('should display teacher dashboard', () => {
    cy.url().should('include', '/teacher');
    cy.contains('Teacher Dashboard').should('be.visible');
  });

  it('should display teacher courses', () => {
    cy.visit('/teacher/courses');
    cy.wait('@getTeacherCourses');
    cy.contains('Mathematics').should('be.visible');
    cy.contains('Physics').should('be.visible');
  });

  it('should navigate to course assignments', () => {
    cy.visit('/teacher/courses');
    cy.wait('@getTeacherCourses');

    cy.intercept('GET', '**/laboratories/getByCourse.php*', {
      statusCode: 200,
      body: []
    });

    cy.contains('Mathematics').click();
    cy.url().should('include', '/course-assignments');
  });
});

