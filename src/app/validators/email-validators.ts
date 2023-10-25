import { Validators } from '@angular/forms';


export class EmailValidators {

    static getValidatorsForEmail(isJoint: boolean) {
        const validators = [
            Validators.minLength(4),
            Validators.maxLength(50),
            Validators.email,
            Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$'),
        ];

        if (isJoint) {
            validators.unshift(Validators.required);
        }

        return validators;
    }
}