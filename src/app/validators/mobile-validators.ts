import { Validators } from '@angular/forms';


export class MobileValidators {

    static getValidatorsForMobile(isJoint: boolean) {
        const validators = [
            Validators.minLength(7),
            Validators.maxLength(16),
            Validators.pattern(/^\+?\d{1,4}[-.\s]?\d{1,14}$/),
        ];
    
        if (isJoint) {
          validators.unshift(Validators.required);
        }
    
        return validators;
      }
}