const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const sql = require('mssql');
const session = require('express-session');
const path = require('path');

// Configuración de la base de datos SQL Server
/*const dbConfig = {
    user: 'sa',
    password: '1234',
    server: 'localhost', // o el servidor donde está alojado tu SQL Server
    database: 'UsuariosDB',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};*/

const dbConfig = {
    user: 'db_ab00fe_bdusuarios_admin',
    password: 'abc123daniela', // Reemplaza con la contraseña real
    server: 'SQL1001.site4now.net',
    database: 'db_ab00fe_bdusuarios',
    options: {
        encrypt: true, // Requerido para conexiones en la nube
        trustServerCertificate: false // Cambiar a false en producción
    }
};

const app = express();

// Configura el motor de plantillas EJS y las vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// CSS
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secreto_session',
    resave: false,
    saveUninitialized: false
}));

// Ruta para mostrar el formulario de login
app.get('/', (req, res) => {
    res.render('login', { message: '' }); // Renderizar el login
});

// Ruta para manejar el login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM Usuarios WHERE username = @username');

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            const validPassword = await bcrypt.compare(password, user.password);
            if (validPassword) {
                req.session.userId = user.id;
                return res.redirect('/dashboard');
            }
        }
        res.render('login', { message: 'Usuario o contraseña incorrectos' });
    } catch (err) {
        console.error(err);
        res.send('Error al conectarse a la base de datos');
    }
});

// Ruta para mostrar el formulario de registro
app.get('/register', (req, res) => {
    res.render('register', { message: '' }); // Renderizar el formulario de registro
});

// Ruta para manejar el registro de usuario
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Verificar si el nombre de usuario ya existe
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM Usuarios WHERE username = @username');

        if (result.recordset.length > 0) {
            return res.render('register', {
                message: { text: 'El nombre de usuario ya está registrado', type: 'error' }
            });
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertar el nuevo usuario en la base de datos
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, hashedPassword)
            .query('INSERT INTO Usuarios (username, password) VALUES (@username, @password)');

        // Redirigir al login con un mensaje de éxito
        res.render('login', { message: { text: 'Registro exitoso. Ahora puedes iniciar sesión.', type: 'success' } });
    } catch (err) {
        console.error(err);
        res.render('register', {
            message: { text: 'Error al registrar el usuario', type: 'error' }
        });
    }
});

// Ruta para el dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    res.render('dashboard');
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.redirect('/');
    });
});

// Servidor en el puerto 3000
app.listen(3000, () => {
    console.log('Servidor en http://localhost:3000');
});
