import {IsString, Length} from "class-validator";

export class Task {
    id?: number;

    @IsString()
    @Length(5, 50)
    name: string;

    @IsString()
    @Length(10, 500)
    description: string;
    completedAt: string | null;
    createdAt: string | null;

    constructor(name: string, description: string, completedAt: string | null, createdAt: string | null) {
        this.id = undefined;
        this.name = name;
        this.description = description;
        this.completedAt = completedAt;
        this.createdAt = createdAt;
    }
}
