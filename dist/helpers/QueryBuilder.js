"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QueryBuilder {
    constructor(modelQuery, query) {
        this.modelQuery = modelQuery;
        this.query = query;
    }
    // Searching
    search(searchableFields) {
        var _a;
        if ((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.searchTerm) {
            this.modelQuery = this.modelQuery.find({
                $or: searchableFields.map(field => ({
                    [field]: {
                        $regex: this.query.searchTerm,
                        $options: 'i',
                    },
                })),
            });
        }
        return this;
    }
    // Filtering
    filter() {
        const queryObj = { ...this.query };
        const excludeFields = [
            'searchTerm',
            'sort',
            'page',
            'limit',
            'fields',
            'withLocked',
            'showHidden',
            'download',
            'minPrice',
            'maxPrice',
            'startTime',
            'endTime',
            'availableDate',
            'latitude',
            'longitude',
            'radius',
            'language',
            'serviceCategory',
            "postCode",
            'skills'
        ];
        excludeFields.forEach(el => delete queryObj[el]);
        const filters = cleanObject(queryObj);
        // ✅ Handle provider specific nested fields if present in original query
        if (this.query.serviceCategory) {
            filters["providerProfile.serviceCategory"] = { $in: Array.isArray(this.query.serviceCategory) ? this.query.serviceCategory : [this.query.serviceCategory] };
        }
        if (this.query.skills) {
            filters["providerProfile.skills"] = { $in: Array.isArray(this.query.skills) ? this.query.skills : [this.query.skills] };
        }
        // Handle salary range filtering
        if (queryObj.minSalary || queryObj.maxSalary) {
            if (queryObj.minSalary) {
                filters.minSalary = { $gte: Number(queryObj.minSalary) };
            }
            if (queryObj.maxSalary) {
                filters.maxSalary = { $lte: Number(queryObj.maxSalary) };
            }
        }
        // ✅ Add partial match for jobLocation
        if (this.query.jobLocation) {
            filters.jobLocation = {
                $regex: this.query.jobLocation,
                $options: 'i', // case-insensitive
            };
        }
        this.modelQuery = this.modelQuery.find(filters);
        return this;
    }
    // Sorting
    sort(sortStr) {
        var _a;
        let sort = sortStr || ((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.sort) || '-createdAt';
        this.modelQuery = this.modelQuery.sort(sort);
        return this;
    }
    // Pagination
    paginate() {
        var _a, _b;
        let limit = Number((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.limit) || 10;
        let page = Number((_b = this === null || this === void 0 ? void 0 : this.query) === null || _b === void 0 ? void 0 : _b.page) || 1;
        let skip = (page - 1) * limit;
        this.modelQuery = this.modelQuery.skip(skip).limit(limit);
        return this;
    }
    // Fields filtering
    fields() {
        var _a, _b;
        let fields = ((_b = (_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.split(',').join(' ')) || '-__v';
        this.modelQuery = this.modelQuery.select(fields);
        return this;
    }
    // Populating (flat + nested supported)
    populate(populateFields, selectFields = {}) {
        this.modelQuery = this.modelQuery.populate(populateFields.map(field => typeof field === 'string'
            ? { path: field, select: selectFields[field] }
            : field));
        return this;
    }
    // Geolocation Search (Radius/Bounding Box)
    geolocation() {
        const { latitude, longitude, radius } = this.query;
        if (latitude != null && longitude != null) {
            const lat = Number(latitude);
            const lon = Number(longitude);
            const searchRadius = radius ? Number(radius) : 0;
            // Bounding box optimization (1 degree latitude ≈ 111.32km)
            const maxProviderRadius = 100;
            const totalRadius = searchRadius + maxProviderRadius;
            const latDiff = totalRadius / 111.32;
            const lonDiff = totalRadius / (111.32 * Math.cos(lat * (Math.PI / 180)));
            // Primary filter using bounding box for performance (if indices exist)
            // Then use $expr for precise distance calculation considering BOTH radii
            this.modelQuery = this.modelQuery.find({
                "providerProfile.workLocation.latitude": { $gte: lat - latDiff, $lte: lat + latDiff },
                "providerProfile.workLocation.longitude": { $gte: lon - lonDiff, $lte: lon + lonDiff },
                $expr: {
                    $let: {
                        vars: {
                            // Distance formula (approximate, distance in km)
                            d_lat: { $subtract: ["$providerProfile.workLocation.latitude", lat] },
                            d_lon: { $subtract: ["$providerProfile.workLocation.longitude", lon] }
                        },
                        in: {
                            $let: {
                                vars: {
                                    // sqrt((d_lat*111.32)^2 + (d_lon*111.32*cos(lat))^2)
                                    dist: {
                                        $sqrt: {
                                            $add: [
                                                { $pow: [{ $multiply: ["$$d_lat", 111.32] }, 2] },
                                                { $pow: [{ $multiply: ["$$d_lon", 111.32, Math.cos(lat * (Math.PI / 180))] }, 2] }
                                            ]
                                        }
                                    }
                                },
                                in: {
                                    // ✅ Matches if distance is within PROVIDER service radius 
                                    // AND provider has at least the requested capacity (searchRadius)
                                    $and: [
                                        { $lte: ["$$dist", { $ifNull: ["$providerProfile.workLocation.radius", 0] }] },
                                        { $gte: [{ $ifNull: ["$providerProfile.workLocation.radius", 0] }, searchRadius] }
                                    ]
                                }
                            }
                        }
                    }
                }
            });
        }
        return this;
    }
    // Provider Specific Advanced Filtering
    providerFilter() {
        const { minPrice, maxPrice, startTime, endTime, availableDate, language } = this.query;
        const filters = {};
        if (language) {
            filters["providerProfile.languages"] = { $in: [language] };
        }
        if (minPrice || maxPrice) {
            filters["providerProfile.hourlyRate"] = {};
            if (minPrice)
                filters["providerProfile.hourlyRate"].$gte = Number(minPrice);
            if (maxPrice)
                filters["providerProfile.hourlyRate"].$lte = Number(maxPrice);
        }
        // ✅ Inclusion Range Search: Provider shift must be within the user's requested window
        if (startTime && endTime) {
            filters["providerProfile.workingHours.startTime"] = { $gte: startTime };
            filters["providerProfile.workingHours.endTime"] = { $lte: endTime };
        }
        else if (startTime) {
            filters["providerProfile.workingHours.startTime"] = { $gte: startTime };
        }
        else if (endTime) {
            filters["providerProfile.workingHours.endTime"] = { $lte: endTime };
        }
        if (availableDate) {
            const date = new Date(availableDate);
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const dayName = days[date.getUTCDay()];
            const searchDate = new Date(availableDate);
            searchDate.setUTCHours(0, 0, 0, 0);
            filters["providerProfile.workingDays"] = { $in: [dayName] };
            filters["providerProfile.unavailableDates"] = { $ne: searchDate };
        }
        this.modelQuery = this.modelQuery.find(filters);
        return this;
    }
    // Pagination info
    async getPaginationInfo() {
        var _a, _b;
        const total = await this.modelQuery.model.countDocuments(this.modelQuery.getFilter());
        const limit = Number((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.limit) || 10;
        const page = Number((_b = this === null || this === void 0 ? void 0 : this.query) === null || _b === void 0 ? void 0 : _b.page) || 1;
        const totalPage = Math.ceil(total / limit);
        return {
            total,
            limit,
            page,
            totalPage,
        };
    }
}
function cleanObject(obj) {
    const cleaned = {};
    for (const key in obj) {
        const value = obj[key];
        if (value !== null &&
            value !== undefined &&
            value !== '' &&
            value !== 'undefined' &&
            !(Array.isArray(value) && value.length === 0) &&
            !(typeof value === 'object' &&
                !Array.isArray(value) &&
                Object.keys(value).length === 0)) {
            cleaned[key] = value;
        }
    }
    return cleaned;
}
exports.default = QueryBuilder;
