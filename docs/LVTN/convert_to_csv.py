#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script để chuyển đổi file markdown mô tả database thành CSV
Có thể import trực tiếp vào Excel hoặc Word
"""

import re
import csv
import os

def parse_markdown_to_csv():
    """Đọc file markdown và chuyển đổi thành CSV"""
    
    # Đọc file markdown
    with open('description.md', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Tìm tất cả các bảng
    tables = []
    current_table = None
    current_description = ""
    
    lines = content.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Tìm tiêu đề bảng (## Bảng ...)
        if line.startswith('## Bảng '):
            if current_table:
                tables.append(current_table)
            
            table_name = line.replace('## Bảng ', '').strip()
            current_table = {
                'name': table_name,
                'description': '',
                'columns': []
            }
            i += 1
            continue
        
        # Tìm mô tả bảng
        if line.startswith('**Mô tả:**') and current_table:
            current_table['description'] = line.replace('**Mô tả:**', '').strip()
            i += 1
            continue
        
        # Tìm header của bảng markdown
        if '| Thuộc tính' in line and current_table:
            # Bỏ qua header line
            i += 1
            # Bỏ qua separator line
            if i < len(lines) and ('|---' in lines[i] or '| :---' in lines[i]):
                i += 1

            # Đọc các dòng dữ liệu
            while i < len(lines):
                data_line = lines[i].strip()
                if not data_line or not data_line.startswith('|') or data_line.startswith('##'):
                    break

                # Parse dòng dữ liệu
                parts = [part.strip() for part in data_line.split('|')]
                # Loại bỏ phần tử đầu và cuối (thường là rỗng)
                if len(parts) > 2:
                    parts = parts[1:-1]

                if len(parts) >= 6:
                    column = {
                        'attribute': parts[0].replace(':', '').strip(),
                        'type': parts[1],
                        'key': parts[2],
                        'unique': parts[3],
                        'mandatory': parts[4],
                        'description': parts[5]
                    }
                    current_table['columns'].append(column)
                i += 1
            continue
        
        i += 1
    
    # Thêm bảng cuối cùng
    if current_table:
        tables.append(current_table)
    
    return tables

def create_csv_files(tables):
    """Tạo các file CSV từ dữ liệu bảng"""
    
    # Tạo thư mục output
    os.makedirs('csv_output', exist_ok=True)
    
    # File tổng hợp tất cả bảng
    with open('csv_output/all_tables.csv', 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(['Tên Bảng', 'Mô tả', 'Thuộc tính', 'Kiểu dữ liệu', 'Khóa', 'Duy nhất', 'Bắt buộc', 'Diễn giải'])
        
        for table in tables:
            for i, column in enumerate(table['columns']):
                row = [
                    table['name'] if i == 0 else '',  # Chỉ hiển thị tên bảng ở dòng đầu
                    table['description'] if i == 0 else '',  # Chỉ hiển thị mô tả ở dòng đầu
                    column['attribute'],
                    column['type'],
                    column['key'],
                    column['unique'],
                    column['mandatory'],
                    column['description']
                ]
                writer.writerow(row)
            
            # Thêm dòng trống giữa các bảng
            writer.writerow([''] * 8)
    
    # Tạo file riêng cho từng bảng
    for table in tables:
        filename = f"csv_output/{table['name']}.csv"
        with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.writer(f)
            writer.writerow(['Bảng', table['name']])
            writer.writerow(['Mô tả', table['description']])
            writer.writerow([])  # Dòng trống
            writer.writerow(['Thuộc tính', 'Kiểu dữ liệu', 'Khóa', 'Duy nhất', 'Bắt buộc', 'Diễn giải'])
            
            for column in table['columns']:
                writer.writerow([
                    column['attribute'],
                    column['type'],
                    column['key'],
                    column['unique'],
                    column['mandatory'],
                    column['description']
                ])

def create_word_table_format():
    """Tạo file text với format dễ copy vào Word"""
    
    tables = parse_markdown_to_csv()
    
    with open('csv_output/word_format.txt', 'w', encoding='utf-8') as f:
        for table in tables:
            f.write(f"Bảng: {table['name']}\n")
            f.write(f"Mô tả: {table['description']}\n\n")
            
            # Header
            f.write("Thuộc tính\tKiểu dữ liệu\tKhóa\tDuy nhất\tBắt buộc\tDiễn giải\n")
            
            # Data rows
            for column in table['columns']:
                f.write(f"{column['attribute']}\t{column['type']}\t{column['key']}\t{column['unique']}\t{column['mandatory']}\t{column['description']}\n")
            
            f.write("\n" + "="*80 + "\n\n")

if __name__ == "__main__":
    print("Đang chuyển đổi file markdown sang CSV...")
    
    try:
        tables = parse_markdown_to_csv()
        print(f"Đã tìm thấy {len(tables)} bảng")
        
        create_csv_files(tables)
        create_word_table_format()
        
        print("Hoàn thành! Các file đã được tạo trong thư mục 'csv_output':")
        print("- all_tables.csv: File tổng hợp tất cả bảng")
        print("- [tên_bảng].csv: File riêng cho từng bảng")
        print("- word_format.txt: Format tab-separated để copy vào Word")
        
    except Exception as e:
        print(f"Lỗi: {e}")
