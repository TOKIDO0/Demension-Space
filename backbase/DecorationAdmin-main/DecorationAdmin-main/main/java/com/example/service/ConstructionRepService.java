package com.example.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.ConstructionRep;
import com.example.entity.Constructionrec;
import com.example.entity.CustomerRep;
import com.example.entity.Receipt;
import com.example.exception.CustomException;
import com.example.mapper.*;
import org.apache.ibatis.javassist.expr.NewArray;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

@Service
public class ConstructionRepService extends ServiceImpl<ConstructionRepMapper, ConstructionRep> {

    @Resource
    private ConstructioninfoService constructioninfoService;
    @Resource
    private ConstructioncertService constructioncertService;
    @Resource
    private ConstructioncertMapper constructioncertMapper;
    @Resource
    private ConstructioninfoMapper constructioninfoMapper;
    @Resource
    private ConstructionrecService constructionrecService;
    @Resource
    private ConstructionrecMapper constructionrecMapper;

    public List<ConstructionRep> generate(long id)
    {
        List<ConstructionRep> constructionReps =new ArrayList<>();
        List<Constructionrec> constructionrecList = new ArrayList<>();
        QueryWrapper<Constructionrec> wrapper1 = new QueryWrapper<>();
        wrapper1.eq("projectid",id);
        constructionrecList=constructionrecMapper.selectList(wrapper1);
        if(constructionrecList.size()==0)
        {
            throw new CustomException("-1", "无此项目");
        }
        QueryWrapper<Constructionrec> wrapper2= new QueryWrapper<>();
        for (Constructionrec constructionrec : constructionrecList)
        {
            ConstructionRep constructionRep = new ConstructionRep();
            constructionRep.setCertid(constructioncertService.getById
                    (constructioninfoService.getById(constructionrec.getConstructionid()).getCertid()).getId());
            constructionRep.setCertname(constructioncertService.getById
                    (constructioninfoService.getById(constructionrec.getConstructionid()).getCertid()).getName());
            constructionRep.setConstructionname
                    (constructionrec.getName());
            constructionRep.setMoney(constructionrec.getMoney());
            constructionRep.setProjectid(id);

            constructionReps.add(constructionRep);
        }
        return constructionReps;
    }




}
