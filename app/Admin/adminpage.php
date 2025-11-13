<?php
// Include the database connection. Assumes $pdo is available after this.
include_once '../Core/db.php';

// --- Configuration ---
$admin_tables = [
    'Users', 'Courses', 'User_Courses', 'Assignments', 
    'User_Assignments', 'Notes', 'Files', 'Time_Tables', 
    'Schedules', 'Recurring_Tasks'
];

$view = $_GET['view'] ?? 'dashboard';
$table_name = $_GET['table'] ?? null;
$message = '';

// --- CRUD Functions (CREATE/ADD Logic for Users Table) ---

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['add_user_submit'])) {
    
    // 1. Collect and Sanitize Input
    $username = trim($_POST['username']);
    $email = trim($_POST['email']);
    $password = $_POST['password']; // Raw password
    $role = $_POST['role'];
    
    // Simple basic validation
    if (empty($username) || empty($email) || empty($password) || empty($role)) {
        $message = '<div class="alert alert-danger">Error: All required fields must be filled.</div>';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $message = '<div class="alert alert-danger">Error: Invalid email format.</div>';
    } elseif (strlen($password) < 6) {
        $message = '<div class="alert alert-danger">Error: Password must be at least 6 characters.</div>';
    } else {
        // 2. Hash Password (CRITICAL for security)
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        
        try {
            // 3. Prepare and Execute INSERT Query
            $sql = "INSERT INTO Users (username, email, password_hash, role) 
                    VALUES (:username, :email, :password_hash, :role)";
            $stmt = $pdo->prepare($sql);
            
            $stmt->execute([
                'username' => $username,
                'email' => $email,
                'password_hash' => $password_hash,
                'role' => $role
            ]);
            
            $message = '<div class="alert alert-success">✅ User **' . htmlspecialchars($username) . '** added successfully!</div>';
            
        } catch (PDOException $e) {
            // Check for specific error like duplicate entry
            if ($e->getCode() === '23000') {
                 $message = '<div class="alert alert-warning">Warning: Username or Email already exists.</div>';
            } else {
                 $message = '<div class="alert alert-danger">Database Error: Could not add user. ' . htmlspecialchars($e->getMessage()) . '</div>';
            }
        }
    }
}


/**
 * Fetches all records from a given table.
 */
function fetch_table_data(PDO $pdo, string $table): ?array {
    global $admin_tables, $message;
    if (!in_array($table, $admin_tables)) {
        return null;
    }
    try {
        // Fetch up to 100 records and order by primary key descending (most recent first)
        $pk_column = ($table === 'Users') ? 'user_id' : (($table === 'Courses') ? 'course_id' : '1');
        $stmt = $pdo->query("SELECT * FROM `$table` ORDER BY $pk_column DESC LIMIT 100"); 
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        $message = '<div class="alert alert-danger">Database Error: Failed to load table data.</div>';
        return null;
    }
}

// --- HTML Start & Styling ---
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .container { margin-top: 20px; }
        .table-responsive { max-height: 70vh; overflow-y: auto; }
        .sticky-top-actions { position: sticky; top: 0; background-color: white; z-index: 10; padding: 10px 0; border-bottom: 1px solid #ccc; }
        .data-cell { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    </style>
</head>
<body>

<div class="container-fluid container">
    <h1 class="mb-4">📚 App Database Admin Panel</h1>
    
    <?php echo $message; // Display success/error messages ?>

    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item <?php echo $view === 'dashboard' ? 'active' : ''; ?>">
            <a href="admin.php">Dashboard</a>
        </li>
        <?php if ($view === 'view_table'): ?>
        <li class="breadcrumb-item active" aria-current="page"><?php echo htmlspecialchars($table_name); ?> Management</li>
        <?php endif; ?>
      </ol>
    </nav>
    
    <hr>
    
    <?php if ($view === 'dashboard'): ?>
        
        <h2>Available Tables</h2>
        <p class="text-muted">Click on a table to view its data. The **Users** table includes the "Add New" form.</p>
        <div class="list-group">
            <?php foreach ($admin_tables as $table): ?>
                <a href="admin.php?view=view_table&table=<?php echo $table; ?>" class="list-group-item list-group-item-action <?php echo ($table === 'Users') ? 'list-group-item-success' : ''; ?>">
                    **<?php echo $table; ?>** (View Data)
                </a>
            <?php endforeach; ?>
        </div>

    <?php elseif ($view === 'view_table' && $table_name): ?>
        
        <h2>**<?php echo htmlspecialchars($table_name); ?>** Data Management</h2>

        <?php 
        // 1. ADD NEW USER FORM (Only for the Users Table)
        if ($table_name === 'Users'): 
        ?>
            <div class="card mb-4">
                <div class="card-header bg-success text-white">
                    ➕ **Add New User**
                </div>
                <div class="card-body">
                    <form method="POST" action="admin.php?view=view_table&table=Users">
                        <div class="row g-3">
                            <div class="col-md-3">
                                <input type="text" name="username" class="form-control" placeholder="Username" required>
                            </div>
                            <div class="col-md-3">
                                <input type="email" name="email" class="form-control" placeholder="Email" required>
                            </div>
                            <div class="col-md-2">
                                <input type="password" name="password" class="form-control" placeholder="Password" required minlength="6">
                            </div>
                            <div class="col-md-2">
                                <select name="role" class="form-select" required>
                                    <option value="">Select Role</option>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Student">Student</option>
                                    <option value="Individual">Individual</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <button type="submit" name="add_user_submit" class="btn btn-success w-100">Add User</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        <?php endif; ?>

        <?php
        // 2. VIEW DATA TABLE
        $data = fetch_table_data($pdo, $table_name);
        
        if ($data):
            $headers = array_keys($data[0]);
        ?>
            <h4 class="mt-4">Existing Records (<?php echo count($data); ?> found)</h4>
            <div class="table-responsive">
                <table class="table table-striped table-bordered table-sm">
                    <thead class="table-dark sticky-top">
                        <tr>
                            <?php foreach ($headers as $header): ?>
                                <th><?php echo htmlspecialchars($header); ?></th>
                            <?php endforeach; ?>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($data as $row): ?>
                            <tr>
                                <?php foreach ($row as $value): ?>
                                    <td class="data-cell" title="<?php echo htmlspecialchars($value); ?>">
                                        <?php echo htmlspecialchars($value); ?>
                                    </td>
                                <?php endforeach; ?>
                                <td>
                                    <button class="btn btn-primary btn-sm disabled">Edit</button>
                                    <button class="btn btn-danger btn-sm disabled">Delete</button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php else: ?>
            <div class="alert alert-info">No data found in the **<?php echo htmlspecialchars($table_name); ?>** table, or an error occurred.</div>
        <?php endif; ?>

    <?php else: ?>
        <div class="alert alert-warning">Invalid view requested.</div>
    <?php endif; ?>

</div>

</body>
</html>