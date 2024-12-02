const bcrypt = require('bcryptjs');

const password = 'miContraseña123'; // La contraseña que deseas encriptar

// Encriptar la contraseña
bcrypt.genSalt(10, (err, salt) => {
    if (err) {
        console.log('Error al generar el salt:', err);
        return;
    }

    bcrypt.hash(password, salt, (err, hashedPassword) => {
        if (err) {
            console.log('Error al encriptar la contraseña:', err);
            return;
        }

        console.log('Contraseña encriptada:', hashedPassword);
    });
});