describe('Teachers Management', () => {
  const testTeacher = {
    name: 'Test Professor Cypress',
    email: `test.professor.${Date.now()}@university.ro`
  };

  beforeEach(() => {
    // Login as admin
    cy.visit('/login');
    cy.get('input[type="email"]').clear().type('admin@school.com');
    cy.get('input[type="password"]').clear().type('admin');
    cy.get('button[type="submit"]').click();
    
    // Wait for successful login by checking for navbar or specific content
    cy.contains('a', 'Profesori', { timeout: 10000 }).should('be.visible');
    
    // Navigate to teachers page
    cy.contains('a', 'Profesori').click();
    cy.url().should('include', '/admin/teachers', { timeout: 10000 });
    cy.wait(1000); // Wait for teachers page to load
    
    // Close any open modals from previous tests
    cy.get('body').then($body => {
      if ($body.find('.modal.show').length > 0) {
        cy.get('.btn-close').click({ multiple: true, force: true });
        cy.wait(500);
      }
    });
  });

  it('should create a new teacher', () => {
    // Click Add Teacher button
    cy.contains('button', 'Adaugă Profesor').click();
    
    // Wait for modal to be visible
    cy.get('.modal.show').should('be.visible');
    
    // Fill in the modal form
    cy.get('#teacherName').should('be.visible').type(testTeacher.name);
    cy.get('#teacherEmail').should('be.visible').type(testTeacher.email);
    
    // Submit the form
    cy.contains('button', 'Adaugă').click();
    
    // Verify the modal is closed
    cy.get('.modal.show').should('not.exist');
    cy.wait(500);
    
    // Verify the teacher appears in the table
    cy.contains('td', testTeacher.name).should('be.visible');
    cy.contains('td', testTeacher.email).should('be.visible');
  });

  it('should display teacher in the table', () => {
    // First create a teacher
    cy.contains('button', 'Adaugă Profesor').click();
    cy.get('.modal.show').should('be.visible');
    cy.get('#teacherName').type(testTeacher.name);
    cy.get('#teacherEmail').type(testTeacher.email);
    cy.contains('button', 'Adaugă').click();
    
    // Wait for modal to close
    cy.get('.modal.show').should('not.exist');
    cy.wait(500);
    
    // Search for the teacher
    cy.get('input[placeholder*="Caută"]').type(testTeacher.name);
    
    // Verify teacher is displayed
    cy.get('table tbody tr').should('contain', testTeacher.name);
    cy.get('table tbody tr').should('contain', testTeacher.email);
    
    // Verify table has correct columns
    cy.get('table thead th').should('contain', 'Nume');
    cy.get('table thead th').should('contain', 'Email');
    cy.get('table thead th').should('contain', 'Acțiuni');
  });

  it('should delete a teacher', () => {
    // First create a teacher
    cy.contains('button', 'Adaugă Profesor').click();
    cy.get('.modal.show').should('be.visible');
    cy.get('#teacherName').type(testTeacher.name);
    cy.get('#teacherEmail').type(testTeacher.email);
    cy.contains('button', 'Adaugă').click();
    
    // Wait for modal to close
    cy.get('.modal.show').should('not.exist');
    cy.wait(500);
    
    // Verify teacher exists
    cy.contains('td', testTeacher.name).should('be.visible');
    
    // Find the row containing our teacher and click delete
    cy.contains('tr', testTeacher.name)
      .find('button')
      .contains('Șterge')
      .click();
    
    // Confirm deletion in the alert
    cy.on('window:confirm', () => true);
    
    // Verify teacher is removed from the table
    cy.contains('td', testTeacher.name).should('not.exist');
    cy.contains('td', testTeacher.email).should('not.exist');
  });

  it('should complete full CRUD cycle: create, view, and delete', () => {
    const uniqueTeacher = {
      name: `Full Test Professor ${Date.now()}`,
      email: `full.test.${Date.now()}@university.ro`
    };
    
    // CREATE
    cy.contains('button', 'Adaugă Profesor').click();
    cy.get('.modal.show').should('be.visible');
    cy.get('#teacherName').type(uniqueTeacher.name);
    cy.get('#teacherEmail').type(uniqueTeacher.email);
    cy.contains('button', 'Adaugă').click();
    cy.get('.modal.show').should('not.exist');
    cy.wait(500);
    
    // VIEW - Verify in table
    cy.contains('td', uniqueTeacher.name).should('be.visible');
    cy.contains('td', uniqueTeacher.email).should('be.visible');
    
    // Verify using search
    cy.get('input[placeholder*="Caută"]').clear().type(uniqueTeacher.name);
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('table tbody tr').should('contain', uniqueTeacher.name);
    
    // Clear search
    cy.get('input[placeholder*="Caută"]').clear();
    cy.wait(500);
    
    // DELETE
    cy.contains('tr', uniqueTeacher.name)
      .find('button')
      .contains('Șterge')
      .click();
    
    cy.on('window:confirm', () => true);
    
    // Verify deletion
    cy.contains('td', uniqueTeacher.name).should('not.exist');
  });

  it('should validate required fields when creating a teacher', () => {
    // Click Add Teacher button
    cy.contains('button', 'Adaugă Profesor').click();
    cy.get('.modal.show').should('be.visible');
    
    // Try to submit without filling fields
    cy.contains('button', 'Adaugă').should('be.disabled');
    
    // Fill only name
    cy.get('#teacherName').type('Test Name');
    cy.contains('button', 'Adaugă').should('be.disabled');
    
    // Fill email as well
    cy.get('#teacherEmail').type('test@test.com');
    cy.contains('button', 'Adaugă').should('not.be.disabled');
    
    // Cancel instead of submitting
    cy.contains('button', 'Anulează').click();
    cy.get('.modal.show').should('not.exist');
  });

  afterEach(() => {
    // Cleanup: try to delete test teacher if it exists
    cy.get('body').then($body => {
      if ($body.text().includes(testTeacher.name)) {
        cy.contains('tr', testTeacher.name)
          .find('button')
          .contains('Șterge')
          .click();
        cy.on('window:confirm', () => true);
      }
    });
  });
});
