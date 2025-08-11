"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDepartmentNumberFromCode = void 0;
const getDepartmentNumberFromCode = (code) => {
    const departmentMap = {
        'UYAR': '0',
        'UYCA': '1',
        'UYCL': '2',
        'UYCO': '3',
        'UYDU': '4',
        'UYFS': '5',
        'UYFD': '6',
        'UYLA': '7',
        'UYMA': '8',
        'UYMO': '9',
        'UYPA': '10',
        'UYRV': '11',
        'UYRN': '12',
        'UYRO': '13',
        'UYSA': '14',
        'UYSJ': '15',
        'UYSO': '16',
        'UYTA': '17',
        'UYTT': '18'
    };
    return departmentMap[code];
};
exports.getDepartmentNumberFromCode = getDepartmentNumberFromCode;
