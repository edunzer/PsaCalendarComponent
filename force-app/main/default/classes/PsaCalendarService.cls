public with sharing class PsaCalendarService {
    @AuraEnabled(cacheable=true)
    public static List<pse__Assignment__c> fetchAllAssignments(String projectName, String resourceId, String regionId, String practiceId, String groupId) {
        try {
            String projectFilter = String.isBlank(projectName) ? 'Global Time Off Project' : projectName;

            String resourceCondition = resourceId != null ? 'AND pse__Resource__c = :resourceId' : '';
            String regionCondition = regionId != null ? 'AND pse__Resource__r.pse__Region__c = :regionId' : '';
            String practiceCondition = practiceId != null ? 'AND pse__Resource__r.pse__Practice__c = :practiceId' : '';
            String groupCondition = groupId != null ? 'AND pse__Resource__r.pse__Group__c = :groupId' : '';

            String queryString = 
                'SELECT Id, Name, pse__Start_Date__c, pse__End_Date__c, pse__Resource__r.Name, pse__Project__r.Name ' +
                'FROM pse__Assignment__c ' +
                'WHERE pse__Start_Date__c != null ' +
                'AND pse__End_Date__c != null ' +
                'AND pse__Project__r.Name = :projectFilter ' +
                resourceCondition + ' ' +
                regionCondition + ' ' +
                practiceCondition + ' ' +
                groupCondition + 
                ' LIMIT 1000';

            return Database.query(queryString);
        } catch (Exception e) {
            throw new AuraHandledException('Unable to fetch assignments. Please contact admin.');
        }
    }
}
