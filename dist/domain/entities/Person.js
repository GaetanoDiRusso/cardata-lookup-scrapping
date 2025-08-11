"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonPrev = exports.Person = void 0;
class Person {
    constructor(id, name, email, identificationNumber, dateOfBirth) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.identificationNumber = identificationNumber;
        this.dateOfBirth = dateOfBirth;
    }
}
exports.Person = Person;
class PersonPrev {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}
exports.PersonPrev = PersonPrev;
