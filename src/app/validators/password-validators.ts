import { Validators } from '@angular/forms';


export class PasswordsValidators {

    static getValidatorsForPassword(isJoint: boolean) {
        const validators = [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(100),
            Validators.pattern('(?=.*d)(?=.*[a-z])(?=.*[A-Z]).{8,}'),
        ];

        if (isJoint) {
            validators.unshift(Validators.required);
        }

        return validators;
    }
}