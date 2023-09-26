import { Component } from '@angular/core';
import { User } from 'src/app/models/user/user';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {

  listUSers : User[] = [];
  constructor(private userService : UserService){
    this.getAllUSers();
  }


  getAllUSers(){
    this.userService.getAll().subscribe((response : User[])=>{
      this.listUSers = response;
    })
  }
}
