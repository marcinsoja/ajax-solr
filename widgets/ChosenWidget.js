(function($) {

    AjaxSolr.ChosenWidget = AjaxSolr.AbstractFacetWidget.extend({
        init: function() {
            
            var self = this;
            
            $(this.target).find('select').chosen({
                no_results_text: 'no results'
                ,allow_single_deselect: true
            }).change(function(){
                if(self.set($(this).val())) {
                    self.doRequest();
                }
            });
        }
        ,getCurrentSelectedFields: function() {

            var fq = this.manager.store.values('fq')
                ,findIds = this.manager.store.find('fq', new RegExp('^-?' + this.field + ':'))
                ,selectedFields = []
            ;

            if(findIds) {
                selectedFields = str_replace(this.field+':', '', fq[findIds[0]]).split(" OR ");
            }
            
            return selectedFields;
        }
        ,afterRequest: function() {
            
            var facet
                ,option
                ,isSelected
                ,facets = this.getFacets()
                ,selectedFields = this.getCurrentSelectedFields()
                ,select = $(this.target).find('select')
            ;

            select.empty();

            for (var i = 0, l = facets.length; i < l; i++) {
                
                facet = facets[i].facet;
                option = null;
                
                isSelected = (-1 !== AjaxSolr.inArray(facet, selectedFields));
                
                if (facets[i].count || isSelected) {
                    
                    if (isSelected) {
                        option = this.createOption(facet, facets[i].count, isSelected);
                    } else {
                        option = this.createOption(facet, facets[i].count, isSelected);
                    }
                } else {
                    option = this.createOption(facet, facets[i].count, isSelected);
                }

                select.append(option);
            }
            
            select.trigger("liszt:updated");
        }
        ,getFacets: function() {
            
            var facets = []
                ,countFacets
            ;
            
            for (var facetFor in this.manager.response.facet_counts.facet_fields[this.field]) {
                
                countFacets = parseInt(this.manager.response.facet_counts.facet_fields[this.field][facetFor]);
                facets.push({facet: facetFor, count: countFacets});
            }
            
            facets.sort(function(a, b) {
                return a.facet < b.facet ? -1 : 1;
            });
            return facets;
        }
        ,createOption: function(name, count, isSelected) {
            var option = $('<option></option>')
                .attr('value', name)
                .text(name + ' ('+count+')')
            ;
            
            if(isSelected) {
                option.attr('selected', 'selected');
            }

            return option;
        }
        ,fq: function(value, exclude) {
            return (exclude ? '-' : '') + this.field + ':' + AjaxSolr.Parameter.escapeValue(value);
        }
        ,initStore: function() {
            var parameters = [
                'facet.prefix',
                'facet.sort',
                'facet.limit',
                'facet.offset',
                'facet.mincount',
                'facet.missing',
                'facet.method',
                'facet.enum.cache.minDf'
            ];

            this.manager.store.addByValue('facet', true);

            if (this['facet.field'] !== undefined) {
                this.manager.store.add('facet.field', new AjaxSolr.Parameter({
                    name: 'facet.field', 
                    value: this.field, 
                    locals: {
                        ex: this.field
                    }
                }));
            }

            for (var i = 0, l = parameters.length; i < l; i++) {
                if (this[parameters[i]] !== undefined) {
                    this.manager.store.addByValue('f.' + this.field + '.' + parameters[i], this[parameters[i]]);
                }
            }
        }
        ,add: function(value) {
            return this.set(value);
        }
        ,set: function(selected) {

            var self = this;
            
            if(!AjaxSolr.isArray(selected)) {
                selected = []
            }
            return this.changeSelection(function() {
                return self.updateLocalState(selected);
            });
        }
        ,updateLocalState: function(selected) {

            var current = []
                ,self = this
            ;

            $.each(selected, function(i, value) {
                current.push(self.fq(value));
            });

            this.manager.store.removeByValue('fq', new RegExp('^-?' + this.field + ':'));
            
            if (current.length) {
                this.manager.store.add('fq', new AjaxSolr.Parameter({
                    name: 'fq', 
                    value: current.join(' OR '), 
                    locals: {
                        tag: this.field
                    }
                }));
            }
            return true;
        }
    });

})(jQuery);
