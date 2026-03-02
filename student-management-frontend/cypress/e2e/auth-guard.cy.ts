describe('Auth Guard E2E Tests', () => {
  it('should redirect unauthenticated users to login', () => {
    cy.visit('/admin');
    cy.url().should('include', '/login');
  });

  it('should allow authenticated users to access protected routes', () => {
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

    cy.intercept('GET', '**/auth/verify.php*', {
      statusCode: 200,
      body: {
        valid: true,
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin'
        }
      }
    });

    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@example.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/admin');
  });

  it('should prevent student from accessing admin routes', () => {
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

    cy.visit('/login');
    cy.get('input[name="email"]').type('student@example.com');
    cy.get('input[name="password"]').type('student123');
    cy.get('button[type="submit"]').click();

    cy.visit('/admin');
    cy.url().should('include', '/student');
  });

  it('should prevent teacher from accessing admin routes', () => {
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

    cy.visit('/login');
    cy.get('input[name="email"]').type('teacher@example.com');
    cy.get('input[name="password"]').type('teacher123');
    cy.get('button[type="submit"]').click();

    cy.visit('/admin');
    cy.url().should('include', '/teacher');
  });
});

