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
        ];
        excludeFields.forEach(el => delete queryObj[el]);
        const filters = cleanObject(queryObj);
        // Handle salary range filtering
        if (queryObj.minSalary || queryObj.maxSalary) {
            if (queryObj.minSalary) {
                filters.minSalary = { $gte: Number(queryObj.minSalary) };
                delete queryObj.minSalary;
            }
            if (queryObj.maxSalary) {
                filters.maxSalary = { $lte: Number(queryObj.maxSalary) };
                delete queryObj.maxSalary;
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
        if (latitude && longitude && radius) {
            const lat = Number(latitude);
            const lon = Number(longitude);
            const rad = Number(radius); // in kilometers
            // Approximate bounding box (1 degree latitude is ~111km)
            const latDiff = rad / 111;
            const lonDiff = rad / (111 * Math.cos(lat * (Math.PI / 180)));
            this.modelQuery = this.modelQuery.find({
                "residentialAddress.latitude": { $gte: lat - latDiff, $lte: lat + latDiff },
                "residentialAddress.longitude": { $gte: lon - lonDiff, $lte: lon + lonDiff },
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
        if (startTime) {
            filters["providerProfile.workingHours.startTime"] = { $gte: startTime };
        }
        if (endTime) {
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
