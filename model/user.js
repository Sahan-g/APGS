class User{
    constructor(userId,email,Password,isAdmin,firstName, lastName,designation){
        this.userId=userId || null;
        this.email=email;
        this.Password=Password;
        this.isAdmin=isAdmin;
        this.firstName=firstName;
        this.lastName=lastName;
        this.designation=designation;
    }
    }

module.exports= {User};    