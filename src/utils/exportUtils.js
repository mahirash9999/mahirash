export const exportToCSV = (data, keys, headers, fileName) => {
    if (!data || !data.length) {
        alert("No data to export!");
        return;
    }

    const csvRows = [];
    // add headers
    csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

    // add rows
    for (const item of data) {
        const values = keys.map(key => {
            let val = item;
            const parts = key.split('.');
            for (const part of parts) {
                if (val === undefined || val === null) {
                    val = '';
                    break;
                }
                val = val[part];
            }
            const valStr = val === undefined || val === null ? '' : String(val);
            // Escape double quotes by doubling them
            return `"${valStr.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const parseCSV = (text) => {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const next = text[i + 1];

        if (c === '"') {
            if (inQuotes && next === '"') {
                row[row.length - 1] += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            row.push('');
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') {
                i++;
            }
            lines.push(row);
            row = [''];
        } else {
            row[row.length - 1] += c;
        }
    }
    if (row.length > 1 || row[0] !== '') {
        lines.push(row);
    }
    return lines;
};

export const csvToJSON = (csvText, keys, expectedHeaders) => {
    const lines = parseCSV(csvText);
    if (lines.length < 2) return [];

    const csvHeaders = lines[0].map(h => h.trim().toLowerCase());
    const normalizedExpectedHeaders = expectedHeaders.map(h => h.trim().toLowerCase());

    // Find which column index matches which key
    const keyToColIndex = {};
    keys.forEach((key, valIdx) => {
        const expHead = normalizedExpectedHeaders[valIdx];
        const colIdx = csvHeaders.indexOf(expHead);
        if (colIdx !== -1) {
            keyToColIndex[key] = colIdx;
        }
    });

    const results = [];
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

        const obj = {};
        let hasData = false;

        keys.forEach(key => {
            const idx = keyToColIndex[key];
            if (idx !== undefined && idx < row.length) {
                let val = row[idx].trim();
                obj[key] = val;
                if (val !== '') hasData = true;
            }
        });

        if (hasData) {
            results.push(obj);
        }
    }

    return results;
};
