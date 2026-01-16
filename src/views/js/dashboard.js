
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', { 
            method: 'POST' 
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = data.redirectUrl || '/login';
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Fallback redirect
        window.location.href = '/login';
    }
}

async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (data.success && data.user) {
            const userNameElements = document.querySelectorAll('#userName');
            userNameElements.forEach(element => {
                element.textContent = data.user.fullName;
            });
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error loading user info:', error);
        window.location.href = '/login';
    }
}

async function loadDashboardStats() {
    try {
        const response = await fetch('/admin/dashboard/stats');
        const data = await response.json();
        
        if (data.success) {
            const stats = data.stats;
            
            // Update admin dashboard stats
            const totalUsersEl = document.getElementById('totalUsers');
            const totalCoursesEl = document.getElementById('totalCourses');
            const activeSemestersEl = document.getElementById('activeSemesters');
            const totalEnrollmentsEl = document.getElementById('totalEnrollments');
            
            if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers;
            if (totalCoursesEl) totalCoursesEl.textContent = stats.totalCourses;
            if (activeSemestersEl) activeSemestersEl.textContent = stats.activeSemesters;
            if (totalEnrollmentsEl) totalEnrollmentsEl.textContent = stats.totalEnrollments;
        } else {
            console.error('Failed to load dashboard stats:', data.error);
            // Set to 0 if failed to load
            const totalUsersEl = document.getElementById('totalUsers');
            const totalCoursesEl = document.getElementById('totalCourses');
            const activeSemestersEl = document.getElementById('activeSemesters');
            const totalEnrollmentsEl = document.getElementById('totalEnrollments');
            
            if (totalUsersEl) totalUsersEl.textContent = '0';
            if (totalCoursesEl) totalCoursesEl.textContent = '0';
            if (activeSemestersEl) activeSemestersEl.textContent = '0';
            if (totalEnrollmentsEl) totalEnrollmentsEl.textContent = '0';
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Set to 0 if error
        const totalUsersEl = document.getElementById('totalUsers');
        const totalCoursesEl = document.getElementById('totalCourses');
        const activeSemestersEl = document.getElementById('activeSemesters');
        const totalEnrollmentsEl = document.getElementById('totalEnrollments');
        
        if (totalUsersEl) totalUsersEl.textContent = '0';
        if (totalCoursesEl) totalCoursesEl.textContent = '0';
        if (activeSemestersEl) activeSemestersEl.textContent = '0';
        if (totalEnrollmentsEl) totalEnrollmentsEl.textContent = '0';
    }
}

async function loadTeacherStats() {
    // For now, show 0 since there's no real teacher data yet
    const stats = {
        activeCourses: 0,
        totalStudents: 0,
        pendingGrades: 0,
        upcomingClasses: 0
    };
    
    const activeCoursesEl = document.getElementById('activeCourses');
    const totalStudentsEl = document.getElementById('totalStudents');
    const pendingGradesEl = document.getElementById('pendingGrades');
    const upcomingClassesEl = document.getElementById('upcomingClasses');
    
    if (activeCoursesEl) activeCoursesEl.textContent = stats.activeCourses;
    if (totalStudentsEl) totalStudentsEl.textContent = stats.totalStudents;
    if (pendingGradesEl) pendingGradesEl.textContent = stats.pendingGrades;
    if (upcomingClassesEl) upcomingClassesEl.textContent = stats.upcomingClasses;
}


async function loadStudentStats() {
    try {
        const response = await fetch('/student/stats');
        const data = await response.json();

        if (data.success) {
            const stats = data.stats;

            // Target the elements by ID
            const elements = {
                enrolledCourses: document.getElementById('enrolledCourses'),
                currentGPA: document.getElementById('currentGPA'),
                attendanceRate: document.getElementById('attendanceRate'),
                currentCredits: document.getElementById('currentCredits')
            };

            // Update text if elements exist
            if (elements.enrolledCourses) elements.enrolledCourses.textContent = stats.enrolledCourses;
            if (elements.currentGPA) elements.currentGPA.textContent = stats.currentGPA;
            if (elements.attendanceRate) elements.attendanceRate.textContent = stats.attendanceRate;
            if (elements.currentCredits) elements.currentCredits.textContent = stats.currentCredits;
        }
    } catch (error) {
        console.error('Error loading student stats:', error);
    }
}

// Helper to format 2024-01-20T08:00:00 into "08:00"
const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    });
};

async function loadTodaySchedule() {
    const scheduleEl = document.getElementById('todaySchedule');
    if (!scheduleEl) return;

    try {
        const response = await fetch('/student/today-events');
        const data = await response.json();

        if (data.success && data.events.length > 0) {
            scheduleEl.innerHTML = data.events.map(event => `
                <div class="schedule-item">
                    <div class="schedule-time">${formatTime(event.startAt)} - ${formatTime(event.endAt)}</div>
                    <div class="schedule-course">${event.courseId.code} - ${event.courseId.name}</div>
                    <div class="schedule-room">${event.roomId ? event.roomId.code : 'TBA'}</div>
                </div>
            `).join('');
        } else {
            scheduleEl.innerHTML = '<p>No classes scheduled for today.</p>';
        }
    } catch (error) {
        console.error('Failed to load schedule:', error);
    }
}

async function loadTodayClasses() {
    // We can reuse the same API call or even the same data
    const classesEl = document.getElementById('todayClasses');
    if (!classesEl) return;

    try {
        const response = await fetch('/student/today-events');
        const data = await response.json();

        if (data.success && data.events.length > 0) {
            classesEl.innerHTML = data.events.map(event => `
                <div class="schedule-item">
                    <div class="schedule-time">${formatTime(event.startAt)} - ${formatTime(event.endAt)}</div>
                    <div class="schedule-course">${event.courseId.code} - ${event.courseId.name}</div>
                    <div class="schedule-room">${event.roomId ? event.roomId.code : 'TBA'}</div>
                </div>
            `).join('');
        } else {
            classesEl.innerHTML = '<p>No classes today.</p>';
        }
    } catch (error) {
        console.error('Failed to load classes:', error);
    }
}
async function loadUpcomingDeadlines() {
    const deadlinesEl = document.getElementById('upcomingDeadlines');
    if (!deadlinesEl) return;

    try {
        const response = await fetch('/student/upcoming-deadlines');
        const data = await response.json();

        if (data.success && data.deadlines.length > 0) {
            deadlinesEl.innerHTML = data.deadlines.map(item => {
                // Format the ISO date (e.g., Jan 20, 2026)
                const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
                const formattedDate = new Date(item.deadlineAt).toLocaleDateString(undefined, dateOptions);

                return `
                    <div class="assignment-item">
                        <div class="assignment-course">${item.courseId.code}</div>
                        <div class="assignment-title">${item.title}</div>
                        <div class="assignment-deadline">Due: ${formattedDate}</div>
                    </div>
                `;
            }).join('');
        } else {
            deadlinesEl.innerHTML = '<p class="no-data">No upcoming deadlines. Good job!</p>';
        }
    } catch (error) {
        console.error('Error loading deadlines:', error);
        deadlinesEl.innerHTML = '<p>Error loading deadlines.</p>';
    }
}