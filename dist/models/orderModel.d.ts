import mongoose from "mongoose";
export declare const Order: mongoose.Model<{
    date?: string | null;
    hours?: string | null;
    typeFood?: string | null;
    quantity?: number | null;
    user?: mongoose.Types.ObjectId | null;
}, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    date?: string | null;
    hours?: string | null;
    typeFood?: string | null;
    quantity?: number | null;
    user?: mongoose.Types.ObjectId | null;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    date?: string | null;
    hours?: string | null;
    typeFood?: string | null;
    quantity?: number | null;
    user?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    date?: string | null;
    hours?: string | null;
    typeFood?: string | null;
    quantity?: number | null;
    user?: mongoose.Types.ObjectId | null;
}, mongoose.Document<unknown, {}, {
    date?: string | null;
    hours?: string | null;
    typeFood?: string | null;
    quantity?: number | null;
    user?: mongoose.Types.ObjectId | null;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    date?: string | null;
    hours?: string | null;
    typeFood?: string | null;
    quantity?: number | null;
    user?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    [path: string]: mongoose.SchemaDefinitionProperty<undefined, any, any>;
} | {
    [x: string]: mongoose.SchemaDefinitionProperty<any, any, mongoose.Document<unknown, {}, {
        date?: string | null;
        hours?: string | null;
        typeFood?: string | null;
        quantity?: number | null;
        user?: mongoose.Types.ObjectId | null;
    }, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<{
        date?: string | null;
        hours?: string | null;
        typeFood?: string | null;
        quantity?: number | null;
        user?: mongoose.Types.ObjectId | null;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, {
    date?: string | null;
    hours?: string | null;
    typeFood?: string | null;
    quantity?: number | null;
    user?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    date?: string | null;
    hours?: string | null;
    typeFood?: string | null;
    quantity?: number | null;
    user?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=orderModel.d.ts.map