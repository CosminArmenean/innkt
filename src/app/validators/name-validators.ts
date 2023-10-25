import { Validators } from '@angular/forms';


export class NameValidators {

    static getValidatorsForName(isJoint: boolean) {
        const validators = [
            Validators.minLength(2),
            Validators.maxLength(30),
            Validators.pattern(/^[A-Za-z]+$/),
        ];

        if (isJoint) {
            validators.unshift(Validators.required);
        }

        return validators;
    }
}