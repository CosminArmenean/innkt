import { Register } from "../register";


  export interface RegisterOutbound {
    Accounts: Register[];
    IsJointAccount: boolean;
    SharedAccount: boolean;
  }