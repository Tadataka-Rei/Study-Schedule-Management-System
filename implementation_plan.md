# Implementation Plan

Replan the /teacher/assessments route to display a comprehensive list of all assessments created by the teacher across their courses, with integrated functionality to create, edit, and delete assessments directly from this unified view.

The current implementation requires course selection to view assessments, limiting usability. This redesign will provide a centralized assessment management interface, improving teacher workflow by consolidating all assessment operations into a single page.

[Types]
No new type definitions, interfaces, enums, or data structures are required. The existing Assessment model schema supports all necessary fields for CRUD operations.

[Files]
Modify existing files to support the new assessment management workflow.

- src/controllers/teacher/teacherAssessmentController.js
  - Add getAllAssessments function to retrieve all assessments created by the teacher
  - Add updateAssessment function to modify existing assessments
  - Add deleteAssessment function to remove assessments

- src/routes/teacherRoutes.js
  - Add GET /teacher/assessments route for listing all assessments
  - Add PUT /teacher/assessments/:id route for updating assessments
  - Add DELETE /teacher/assessments/:id route for deleting assessments

- src/views/pages/teacher/assessments.html
  - Remove course selection dropdown and related filtering logic
  - Update assessments display to show all assessments in a unified list
  - Add edit assessment modal with pre-populated form fields
  - Add delete confirmation dialog
  - Update JavaScript functions to handle edit and delete operations

[Functions]
Add new functions to handle assessment CRUD operations across all teacher courses.

- getAllAssessments (new function in teacherAssessmentController.js)
  - Retrieves all assessments where course.ownerLecturerId matches the current teacher
  - Populates course information for display
  - Sorts by deadline ascending
  - Returns JSON response with assessments array

- updateAssessment (new function in teacherAssessmentController.js)
  - Validates teacher ownership of the assessment's course
  - Updates assessment fields with provided data
  - Handles validation for required fields and enum values
  - Returns success/error response

- deleteAssessment (new function in teacherAssessmentController.js)
  - Validates teacher ownership of the assessment's course
  - Removes the assessment from database
  - Returns success/error response

[Classes]
No new classes are required. All functionality will be implemented using existing controller functions and model methods.

[Dependencies]
No new dependencies are required. The implementation uses existing mongoose models and Express routing.

[Testing]
Manual testing will verify the new assessment management functionality.

- Test assessment listing displays all teacher assessments across courses
- Test create assessment modal works correctly
- Test edit assessment modal pre-populates and updates correctly
- Test delete assessment with confirmation dialog
- Test error handling for unauthorized access and validation failures

[Implementation Order]
1. Update teacherAssessmentController.js to add getAllAssessments, updateAssessment, and deleteAssessment functions
2. Update teacherRoutes.js to add new routes for assessment CRUD operations
3. Update assessments.html view to implement unified assessment list with edit/delete functionality
