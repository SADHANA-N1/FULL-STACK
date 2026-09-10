const API_URL = 'http://localhost:5000/api/students';

// Grab DOM elements
const form = document.getElementById('studentForm');
const studentIdInput = document.getElementById('studentId');
const nameInput = document.getElementById('name');
const rollNoInput = document.getElementById('rollNo');
const courseInput = document.getElementById('course');
const marksInput = document.getElementById('marks');
const errorMsg = document.getElementById('errorMsg');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEdit');
const tableBody = document.getElementById('studentTableBody');

// Run once page loads
document.addEventListener('DOMContentLoaded', fetchStudents);

// ---------- READ: Fetch all students and render table ----------
async function fetchStudents() {
  try {
    const response = await fetch(API_URL);
    const students = await response.json();
    renderTable(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    errorMsg.textContent = 'Failed to load students. Is the backend running?';
  }
}

// Render the table rows
function renderTable(students) {
  tableBody.innerHTML = '';

  students.forEach((student) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.name}</td>
      <td>${student.rollNo}</td>
      <td>${student.course}</td>
      <td>${student.marks}</td>
      <td>
        <button class="edit-btn" onclick="editStudent('${student._id}', '${student.name}', '${student.rollNo}', '${student.course}', ${student.marks})">Edit</button>
        <button class="delete-btn" onclick="deleteStudent('${student._id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// ---------- Client-side validation ----------
function validateForm() {
  errorMsg.textContent = '';

  if (!rollNoInput.value.trim()) {
    errorMsg.textContent = 'Roll No. is required.';
    return false;
  }

  const marks = Number(marksInput.value);
  if (marksInput.value === '' || marks < 0 || marks > 100) {
    errorMsg.textContent = 'Marks must be between 0 and 100.';
    return false;
  }

  return true;
}

// ---------- CREATE / UPDATE: Form submit handler ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  const studentData = {
    name: nameInput.value.trim(),
    rollNo: rollNoInput.value.trim(),
    course: courseInput.value.trim(),
    marks: Number(marksInput.value),
  };

  const id = studentIdInput.value;

  try {
    if (id) {
      // UPDATE existing student
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
    } else {
      // CREATE new student
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
    }

    resetForm();
    fetchStudents(); // refresh table
  } catch (err) {
    console.error('Error saving student:', err);
    errorMsg.textContent = 'Failed to save student. Try again.';
  }
});

// ---------- Populate form for editing ----------
function editStudent(id, name, rollNo, course, marks) {
  studentIdInput.value = id;
  nameInput.value = name;
  rollNoInput.value = rollNo;
  courseInput.value = course;
  marksInput.value = marks;

  submitBtn.textContent = 'Update Student';
  cancelEditBtn.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- Cancel edit mode ----------
cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
  form.reset();
  studentIdInput.value = '';
  submitBtn.textContent = 'Add Student';
  cancelEditBtn.style.display = 'none';
  errorMsg.textContent = '';
}

// ---------- DELETE: Remove a student ----------
async function deleteStudent(id) {
  const confirmDelete = confirm('Are you sure you want to delete this student?');
  if (!confirmDelete) return;

  try {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchStudents(); // refresh table
  } catch (err) {
    console.error('Error deleting student:', err);
    errorMsg.textContent = 'Failed to delete student.';
  }
}