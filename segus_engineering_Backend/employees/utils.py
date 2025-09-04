import random
import string
import secrets

def generate_secure_password(length=12):
    """
    Génère un mot de passe sécurisé avec des caractères mixtes
    """
    # Caractères disponibles
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    # Assurer au moins un caractère de chaque type
    password = [
        random.choice(lowercase),
        random.choice(uppercase),
        random.choice(digits),
        random.choice(symbols)
    ]
    
    # Remplir le reste avec des caractères aléatoires
    all_chars = lowercase + uppercase + digits + symbols
    for _ in range(length - 4):
        password.append(random.choice(all_chars))
    
    # Mélanger le mot de passe
    random.shuffle(password)
    
    return ''.join(password)

def generate_employee_credentials():
    """
    Génère des identifiants pour un nouvel employé
    """
    return {
        'password': generate_secure_password(),
        'username': None  # Sera généré à partir du nom
    } 