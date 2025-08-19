import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

interface SentenceFilterDropdownProps {
  currentFilter: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (option: string) => void;
}

const DropdownContainer = styled.div`
  position: relative;
`;

const FilterButton = styled.button<{ $isOpen: boolean }>`
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: space-between;
  
  &:hover {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  }
  
  .arrow {
    font-size: 12px;
    transition: transform 0.2s;
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  margin-top: 4px;
`;

const DropdownItem = styled.div<{ $isSelected: boolean }>`
  padding: 8px 16px;
  cursor: pointer;
  color: #333;
  background: ${props => props.$isSelected ? '#e9ecef' : 'transparent'};
  font-weight: ${props => props.$isSelected ? '500' : 'normal'};
  
  &:hover {
    background: #e9ecef;
  }
  
  &:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 8px 8px;
  }
`;

const SentenceFilterDropdown: React.FC<SentenceFilterDropdownProps> = ({
  currentFilter,
  options,
  isOpen,
  onToggle,
  onSelect
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <DropdownContainer ref={dropdownRef}>
      <FilterButton onClick={onToggle} $isOpen={isOpen}>
        <span>{currentFilter}</span>
        <span className="arrow">▼</span>
      </FilterButton>
      
      <DropdownMenu $isOpen={isOpen}>
        {options.map(option => (
          <DropdownItem
            key={option}
            $isSelected={option === currentFilter}
            onClick={() => onSelect(option)}
          >
            {option}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </DropdownContainer>
  );
};

export default SentenceFilterDropdown; 