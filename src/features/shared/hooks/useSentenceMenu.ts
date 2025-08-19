import { useState } from 'react';
import { sentenceApi } from '../../training/api/sentenceApi';
import { useToast } from './useToast';
import { useClipboard } from './useClipboard';
import { TrainingThread } from '../types';

interface UseSentenceMenuProps {
  personaId: string;
  threadType: 'interpretation' | 'proceed' | 'sentence' | 'verbalization';
  selectedThread?: TrainingThread | null;
  memos: Record<string, string>;
  highlightedSentences: Set<string>;
  setMemos: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setHighlightedSentences: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const useSentenceMenu = ({
  personaId,
  threadType,
  selectedThread,
  memos,
  highlightedSentences,
  setMemos,
  setHighlightedSentences
}: UseSentenceMenuProps) => {
  const { showCopyToast } = useToast();
  const { copyTextToClipboard } = useClipboard();
  const [selectedSentences, setSelectedSentences] = useState<Set<string>>(new Set());

  const handleSaveToVault = async (selectedIds: string[], selectedTexts: string[]) => {
    try {
      if (!selectedTexts.length) {
        showCopyToast('저장할 문장을 선택해주세요');
        return;
      }

      if (!selectedThread?.id) {
        showCopyToast('저장할 스레드를 선택해주세요');
        return;
      }

      // 하이라이트/메모 상태 수집
      const highlightStates: boolean[] = [];
      const highlightColors: (string | null)[] = [];
      const memoContents: (string | null)[] = [];
      
      // 메모가 있는 문장들 찾기 (연관된 문장들과 함께)
      let hasMemo = false;
      let memoSentenceId = '';
      let memoContent = '';
      let relatedSentenceIds: string[] = [];
      let relatedSentenceContents: string[] = [];
      
      for (const sentenceId of selectedIds) {
        const isHighlighted = highlightedSentences.has(sentenceId);
        const currentMemoContent = memos[sentenceId] || null;
        
        highlightStates.push(isHighlighted);
        highlightColors.push(isHighlighted ? 'yellow' : null);
        memoContents.push(currentMemoContent);
        
        // 메모가 있는 문장을 찾으면 관련 정보 수집
        if (currentMemoContent && currentMemoContent.trim() !== '') {
          hasMemo = true;
          memoSentenceId = sentenceId;
          memoContent = currentMemoContent;
          relatedSentenceIds = selectedIds; // 선택된 모든 문장이 연관됨
          relatedSentenceContents = selectedTexts;
        }
      }

      // 일반 저장고 저장 (기존 로직)
      await sentenceApi.saveSentencesToVault({
        sentences: selectedTexts,
        source_message_id: `${threadType}_${personaId}`,
        source_conversation_id: selectedThread.id,
        source_thread_id: selectedThread.id,
        source_thread_type: threadType,
        source_sentence_ids: selectedIds,
        tags: [threadType, personaId],
        highlight_states: highlightStates,
        highlight_colors: highlightColors,
        memo_contents: memoContents
      });
      
      // 메모가 있는 경우 메모 저장고에도 별도 저장 (연관된 문장들과 함께)
      if (hasMemo) {
        console.log('=== 메모 저장고 저장 ===');
        console.log('메모 문장 ID:', memoSentenceId);
        console.log('메모 내용:', memoContent);
        console.log('연관된 문장들:', relatedSentenceContents);
        
        try {
          await sentenceApi.saveMemoToVault({
            memo_content: memoContent,
            sentence_content: relatedSentenceContents.length > 1 
              ? relatedSentenceContents.map(s => `"${s}"`).join(', ')  // 여러 문장인 경우
              : relatedSentenceContents[0] || '', // 단일 문장인 경우
            source_message_id: `${threadType}_${personaId}`,
            source_conversation_id: selectedThread.id,
            source_thread_id: selectedThread.id,
            source_thread_type: threadType,
            source_sentence_id: memoSentenceId,
            tags: [threadType, personaId],
            metadata: {
              related_sentence_ids: relatedSentenceIds,
              related_sentence_contents: relatedSentenceContents,
              memo_type: relatedSentenceContents.length > 1 ? 'multi_sentence' : 'single_sentence'
            }
          });
          console.log('메모 저장고 저장 완료');
        } catch (error) {
          console.error('메모 저장고 저장 실패:', error);
        }
      }
      
      // 백엔드에 하이라이트도 저장
      for (const sentenceId of selectedIds) {
        await sentenceApi.createHighlight({
          sentence_id: sentenceId,
          thread_id: selectedThread.id,
          thread_type: threadType
        });
      }
      
      // 성공 시 로컬 상태 업데이트
      setHighlightedSentences(prev => new Set([...Array.from(prev), ...selectedIds]));
      
      if (hasMemo) {
        showCopyToast('저장고에 저장되었습니다 (메모와 연관 문장들 포함)');
      } else {
        showCopyToast('저장고에 저장되었습니다 (하이라이트 정보 포함)');
      }
    } catch (error) {
      console.error('저장고 저장 실패:', error);
      showCopyToast('저장고 저장에 실패했습니다');
    }
  };

  const handleAddMemo = async (selectedIds: string[], selectedTexts: string[]) => {
    if (selectedIds.length === 0) return;

    try {
      // 백엔드에 모든 선택된 문장의 하이라이트 저장
      if (selectedThread?.id) {
        for (const sentenceId of selectedIds) {
          await sentenceApi.createHighlight({
            sentence_id: sentenceId,
            thread_id: selectedThread.id,
            thread_type: threadType
          });
        }
      }
      
      // 마지막 문장 ID 찾기 (가장 큰 인덱스)
      const sortedIds = selectedIds.sort();
      const lastSentenceId = sortedIds[sortedIds.length - 1];
      
      // 마지막 문장에만 빈 메모 추가
      const newMemos: Record<string, string> = {
        [lastSentenceId]: ''
      };
      
      // 메모에 연관된 문장들 정보 저장 (메타데이터로)
      const relatedSentenceIds = selectedIds;
      const relatedSentenceTexts = selectedTexts;
      
      console.log('=== 메모 생성 정보 ===');
      console.log('마지막 문장 ID:', lastSentenceId);
      console.log('연관된 문장 ID들:', relatedSentenceIds);
      console.log('연관된 문장 텍스트들:', relatedSentenceTexts);
      
      // 백엔드에 메모 생성 요청 (연관된 문장들 정보 포함)
      if (selectedThread?.id) {
        try {
          await sentenceApi.createOrUpdateMemo({
            sentence_id: lastSentenceId,
            thread_id: selectedThread.id,
            thread_type: threadType,
            content: '', // 빈 메모로 시작
            related_sentence_ids: relatedSentenceIds,
            related_sentence_contents: relatedSentenceTexts,
            sentence_content: selectedTexts[selectedTexts.length - 1], // 마지막 문장 내용
            source_message_id: `${threadType}_memo_${Date.now()}`
          } as any);
        } catch (error) {
          console.warn('백엔드 메모 생성 실패 (로컬 생성은 성공):', error);
        }
      }
      
      // 로컬 상태 업데이트: 마지막 문장에만 메모 생성, 모든 문장 하이라이트
      setMemos(prev => ({ ...prev, ...newMemos }));
      setHighlightedSentences(prev => new Set([...Array.from(prev), ...selectedIds]));
      
      // 선택된 문장이 여러 개인 경우 안내 메시지
      if (selectedIds.length > 1) {
        showCopyToast(`메모가 마지막 문장에 생성되었습니다 (연관 문장: ${selectedIds.length}개)`);
      } else {
        showCopyToast('메모와 하이라이트가 추가되었습니다');
      }
    } catch (error) {
      console.error('메모/하이라이트 추가 실패:', error);
      showCopyToast('메모/하이라이트 추가에 실패했습니다');
    }
  };

  const handleToggleHighlight = async (selectedIds: string[]) => {
    if (!selectedIds.length || !selectedThread?.id) return;

    try {
      const currentlyHighlighted = selectedIds.filter(id => highlightedSentences.has(id));
      
      if (currentlyHighlighted.length > 0) {
        // 하이라이트 제거
        setHighlightedSentences(prev => {
          const newSet = new Set(prev);
          selectedIds.forEach(id => newSet.delete(id));
          return newSet;
        });
        
        // 백엔드에서 하이라이트 삭제
        for (const sentenceId of selectedIds) {
          try {
            await sentenceApi.deleteHighlight(sentenceId);
          } catch (error) {
            console.warn('백엔드 하이라이트 삭제 실패:', error);
          }
        }
        
        showCopyToast('하이라이트가 제거되었습니다');
      } else {
        // 하이라이트 추가
        setHighlightedSentences(prev => new Set([...Array.from(prev), ...selectedIds]));
        
        // 백엔드에 하이라이트 저장
        for (const sentenceId of selectedIds) {
          try {
            await sentenceApi.createHighlight({
              sentence_id: sentenceId,
              thread_id: selectedThread.id,
              thread_type: threadType
            });
          } catch (error) {
            console.warn('백엔드 하이라이트 저장 실패:', error);
          }
        }
        
        showCopyToast('하이라이트가 추가되었습니다');
      }
    } catch (error) {
      console.error('하이라이트 토글 실패:', error);
      showCopyToast('하이라이트 처리에 실패했습니다');
    }
  };

  const handleMenuAction = async (
    action: 'sendToInput' | 'saveToVault' | 'addMemo' | 'highlight' | 'copy',
    selectedIds: string[],
    selectedTexts: string[],
    messageInputRef?: React.RefObject<any>
  ) => {
    switch (action) {
      case 'sendToInput':
        if (messageInputRef?.current && selectedTexts.length > 0) {
          const formattedText = selectedTexts.map(text => `"${text}"`).join(', ');
          messageInputRef.current.insertText(formattedText);
          showCopyToast('선택한 문장이 입력창에 추가되었습니다');
        }
        break;
      
      case 'saveToVault':
        await handleSaveToVault(selectedIds, selectedTexts);
        break;
      
      case 'addMemo':
        await handleAddMemo(selectedIds, selectedTexts);
        break;
      
      case 'highlight':
        await handleToggleHighlight(selectedIds);
        break;
      
      case 'copy':
        if (selectedTexts.length > 0) {
          await copyTextToClipboard(selectedTexts.join(' '), '선택된 문장이 복사되었습니다');
        }
        break;
    }

    // 모든 선택 해제
    setSelectedSentences(new Set());
  };

  return {
    selectedSentences,
    setSelectedSentences,
    handleMenuAction,
    handleSaveToVault,
    handleAddMemo,
    handleToggleHighlight
  };
}; 