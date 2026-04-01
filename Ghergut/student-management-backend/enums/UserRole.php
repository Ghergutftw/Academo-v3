<?php

/**
 * User Role Constants
 * Defines the available user roles in the system
 */
class UserRole {
    const ADMIN = 'admin';
    const TEACHER = 'teacher';
    const STUDENT = 'student';

    /**
     * Get all valid roles
     * @return array
     */
    public static function all(): array {
        return [
            self::ADMIN,
            self::TEACHER,
            self::STUDENT
        ];
    }

    /**
     * Check if a role is valid
     * @param string $role
     * @return bool
     */
    public static function isValid(string $role): bool {
        return in_array($role, self::all());
    }

    /**
     * Validate role or throw exception
     * @param string $role
     * @throws InvalidArgumentException
     */
    public static function validate(string $role): void {
        if (!self::isValid($role)) {
            throw new InvalidArgumentException("Invalid role: $role. Must be one of: " . implode(', ', self::all()));
        }
    }
}

